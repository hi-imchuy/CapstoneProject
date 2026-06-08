import { useEffect, useMemo, useRef, useState } from 'react'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Container from '@mui/material/Container'
import Divider from '@mui/material/Divider'
import Grid from '@mui/material/Grid'
import Paper from '@mui/material/Paper'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import SmartToyRoundedIcon from '@mui/icons-material/SmartToyRounded'

import {
  clearAIConversationMessagesAPI,
  createAIConversationAPI,
  fetchAIConversationMessagesAPI,
  fetchAIConversationsAPI,
  sendAIMessageAPI,
  updateAIConversationAPI
} from '~/apis'
import AppBar from '~/components/AppBar/AppBar'
import ChatBox from '~/components/ChatBox/ChatBox'

const DEFAULT_TITLE = 'Cuộc trò chuyện mới'
const AI_PARTICIPANT = {
  displayName: 'Trợ lý AI',
  avatar: ''
}

const normalizeVietnameseText = (value = '') => {
  return String(value)
    .replaceAll('Cuá»™c trÃ² chuyá»‡n má»›i', 'Cuộc trò chuyện mới')
    .replaceAll('Trá»£ lÃ½ AI', 'Trợ lý AI')
    .replaceAll('ChÆ°a cÃ³ tin nháº¯n', 'Chưa có tin nhắn')
}

const sortConversations = (items) => {
  return [...items].sort((a, b) => Number(b.updatedAt || 0) - Number(a.updatedAt || 0))
}

const normalizeConversation = (conversation, messages = [], messagesLoaded = false) => ({
  ...conversation,
  id: conversation._id,
  messages,
  messagesLoaded
})

const formatConversationTime = (value) => {
  if (!value) return ''
  return new Date(value).toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit'
  })
}

function AIChat() {
  const [conversations, setConversations] = useState([])
  const [activeConversationId, setActiveConversationId] = useState('')
  const [messageInput, setMessageInput] = useState('')
  const [editingConversationId, setEditingConversationId] = useState('')
  const [editingTitle, setEditingTitle] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)

  const messagesEndRef = useRef(null)
  const initializedRef = useRef(false)
  const skipRenameSaveRef = useRef(false)

  const activeConversation = useMemo(
    () => conversations.find((item) => item.id === activeConversationId) || null,
    [activeConversationId, conversations]
  )

  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true

    const initializeConversations = async () => {
      setIsLoading(true)
      try {
        const data = await fetchAIConversationsAPI()
        let nextConversations = Array.isArray(data)
          ? data.map((item) => normalizeConversation(item))
          : []

        if (!nextConversations.length) {
          const createdConversation = await createAIConversationAPI({ title: DEFAULT_TITLE })
          nextConversations = [normalizeConversation(createdConversation, [], true)]
        }

        nextConversations = sortConversations(nextConversations)
        setConversations(nextConversations)
        setActiveConversationId(nextConversations[0].id)
      } finally {
        setIsLoading(false)
      }
    }

    initializeConversations()
  }, [])

  useEffect(() => {
    if (!activeConversationId || activeConversation?.messagesLoaded) return

    let isCurrent = true
    const loadMessages = async () => {
      const messages = await fetchAIConversationMessagesAPI(activeConversationId)
      if (!isCurrent) return

      setConversations((current) => current.map((item) => (
        item.id === activeConversationId
          ? { ...item, messages: Array.isArray(messages) ? messages : [], messagesLoaded: true }
          : item
      )))
    }

    loadMessages()
    return () => {
      isCurrent = false
    }
  }, [activeConversation?.messagesLoaded, activeConversationId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [activeConversationId, activeConversation?.messages?.length, isSending])

  const handleCreateConversation = async () => {
    if (isLoading || isSending) return
    const createdConversation = await createAIConversationAPI({ title: DEFAULT_TITLE })
    const normalizedConversation = normalizeConversation(createdConversation, [], true)
    setConversations((current) => sortConversations([normalizedConversation, ...current]))
    setActiveConversationId(normalizedConversation.id)
    setMessageInput('')
  }

  const handleSelectConversation = (conversationId) => {
    if (isSending || conversationId === activeConversationId) return
    setActiveConversationId(conversationId)
    setMessageInput('')
  }

  const handleStartEditing = (conversation) => {
    setEditingConversationId(conversation.id)
    setEditingTitle(normalizeVietnameseText(conversation.title))
    skipRenameSaveRef.current = false
  }

  const handleCancelEditing = () => {
    skipRenameSaveRef.current = true
    setEditingConversationId('')
    setEditingTitle('')
  }

  const handleSaveTitle = async (conversation) => {
    if (skipRenameSaveRef.current) {
      skipRenameSaveRef.current = false
      return
    }

    const nextTitle = editingTitle.trim()
    setEditingConversationId('')
    setEditingTitle('')
    if (!nextTitle || nextTitle === normalizeVietnameseText(conversation.title)) return

    try {
      const updatedConversation = await updateAIConversationAPI(conversation.id, { title: nextTitle })
      setConversations((current) => current.map((item) => (
        item.id === conversation.id
          ? { ...item, ...updatedConversation, id: updatedConversation._id }
          : item
      )))
    } catch {
      // The shared Axios interceptor displays the API error.
    }
  }

  const handleTitleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      event.currentTarget.blur()
    }
    if (event.key === 'Escape') {
      event.preventDefault()
      handleCancelEditing()
    }
  }

  const handleSendMessage = async () => {
    const content = messageInput.trim()
    if (!activeConversationId || !content || isSending) return

    const conversationId = activeConversationId
    const optimisticMessage = {
      _id: `temp-${Date.now()}`,
      conversationId,
      role: 'user',
      content,
      createdAt: Date.now()
    }
    const optimisticUpdatedAt = Date.now()

    setMessageInput('')
    setIsSending(true)
    setConversations((current) => sortConversations(current.map((item) => (
      item.id === conversationId
        ? {
            ...item,
            messages: [...item.messages, optimisticMessage],
            messagesLoaded: true,
            latestMessage: optimisticMessage,
            updatedAt: optimisticUpdatedAt
          }
        : item
    ))))

    try {
      const result = await sendAIMessageAPI(conversationId, content)
      setConversations((current) => sortConversations(current.map((item) => {
        if (item.id !== conversationId) return item

        const messagesWithoutOptimistic = item.messages.filter(
          (message) => message._id !== optimisticMessage._id
        )
        return {
          ...item,
          ...result.conversation,
          id: result.conversation._id,
          messages: [...messagesWithoutOptimistic, ...result.messages],
          messagesLoaded: true
        }
      })))
    } catch {
      try {
        const persistedMessages = await fetchAIConversationMessagesAPI(conversationId)
        setConversations((current) => current.map((item) => (
          item.id === conversationId
            ? { ...item, messages: persistedMessages, messagesLoaded: true }
            : item
        )))
      } catch {
        // Keep the optimistic message visible when reconciliation is unavailable.
      }
    } finally {
      setIsSending(false)
    }
  }

  const handleClearMessages = async () => {
    if (!activeConversationId || isSending) return
    const updatedConversation = await clearAIConversationMessagesAPI(activeConversationId)

    setConversations((current) => sortConversations(current.map((item) => (
      item.id === activeConversationId
        ? {
            ...item,
            ...updatedConversation,
            id: updatedConversation._id,
            messages: [],
            messagesLoaded: true
          }
        : item
    ))))
  }

  const handleTextFieldKeyDown = async (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      await handleSendMessage()
    }
  }

  const latestPreview = (conversation) => {
    const latestMessage = conversation.latestMessage
      || conversation.messages[conversation.messages.length - 1]
    return normalizeVietnameseText(latestMessage?.content || 'Chưa có tin nhắn')
  }

  const chatBoxConversation = activeConversation
    ? { ...activeConversation, participant: AI_PARTICIPANT }
    : null

  return (
    <Container
      disableGutters
      maxWidth={false}
      sx={{
        height: '100vh',
        overflow: 'hidden',
        position: 'relative',
        bgcolor: (theme) => theme.palette.mode === 'dark' ? '#081120' : '#eef4fb'
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background: (theme) => theme.palette.mode === 'dark'
            ? 'radial-gradient(circle at top left, rgba(56, 189, 248, 0.16), transparent 26%), radial-gradient(circle at 85% 18%, rgba(99, 102, 241, 0.16), transparent 24%), linear-gradient(180deg, #081120 0%, #0b1628 100%)'
            : 'radial-gradient(circle at top left, rgba(56, 189, 248, 0.14), transparent 24%), radial-gradient(circle at 85% 18%, rgba(99, 102, 241, 0.12), transparent 22%), linear-gradient(180deg, #f8fbff 0%, #eef4fb 100%)'
        }}
      />

      <Box sx={{ position: 'relative', zIndex: 4 }}>
        <AppBar />
      </Box>

      <Grid
        container
        spacing={1.5}
        sx={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          height: (theme) => theme.trello.boardContentHeight,
          m: 0,
          p: { xs: 1.25, md: 1.5 },
          boxSizing: 'border-box'
        }}
      >
        <Grid
          size={{ xs: 12, md: 9 }}
          sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0
          }}
        >
          <ChatBox
            activeConversation={chatBoxConversation}
            messages={activeConversation?.messages || []}
            currentUserName='Bạn'
            getMessageSenderName={() => 'Trợ lý AI'}
            isCurrentUserMessage={(message) => message.role === 'user'}
            participantFallbackLabel='AI'
            emptyTitle={isLoading ? 'Đang tải cuộc trò chuyện...' : 'Chưa có cuộc trò chuyện'}
            emptyDescription='Tạo một cuộc trò chuyện mới để bắt đầu hỏi trợ lý da liễu.'
            emptyIcon={<SmartToyRoundedIcon sx={{ fontSize: 34 }} />}
            statusLabel={isSending ? 'Đang trả lời' : 'Sẵn sàng'}
            statusText={isSending ? 'Trợ lý AI đang xử lý câu hỏi...' : 'Trợ lý tư vấn thông tin da liễu'}
            inactiveStatusText='Tạo một cuộc trò chuyện để bắt đầu'
            messageInput={messageInput}
            onMessageInputChange={setMessageInput}
            onMessageInputKeyDown={handleTextFieldKeyDown}
            onSendMessage={handleSendMessage}
            onClearMessages={handleClearMessages}
            messagesEndRef={messagesEndRef}
            canClearMessages={Boolean(activeConversationId && activeConversation?.messages?.length && !isSending)}
            canSendMessage={Boolean(activeConversationId && messageInput.trim() && !isSending)}
            inputPlaceholder='Nhập câu hỏi về da liễu...'
            disabledInputPlaceholder='Tạo một cuộc trò chuyện trước...'
            showImageUpload={false}
            isSending={isSending}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 3 }} sx={{ minHeight: 0, display: 'flex' }}>
          <Paper
            elevation={0}
            sx={{
              width: '100%',
              height: '100%',
              minHeight: 0,
              borderRadius: '28px',
              overflow: 'hidden',
              border: '1px solid',
              borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(148, 163, 184, 0.14)' : 'rgba(148, 163, 184, 0.18)',
              display: 'flex',
              flexDirection: 'column',
              bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(8, 15, 29, 0.78)' : 'rgba(255, 255, 255, 0.74)',
              backdropFilter: 'blur(18px)',
              boxShadow: '0 22px 60px rgba(15, 23, 42, 0.12)'
            }}
          >
            <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(148, 163, 184, 0.12)' : 'rgba(148, 163, 184, 0.16)' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 1.5 }}>
                <Avatar sx={{ bgcolor: '#4f46e5', width: 42, height: 42 }}>
                  <SmartToyRoundedIcon />
                </Avatar>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: (theme) => theme.palette.mode === 'dark' ? '#f8fafc' : '#0f172a' }}>
                    Hội thoại với AI
                  </Typography>
                  <Typography sx={{ fontSize: '0.8rem', color: (theme) => theme.palette.mode === 'dark' ? '#94a3b8' : '#64748b' }}>
                    {conversations.length} cuộc trò chuyện
                  </Typography>
                </Box>
              </Box>

              <Button
                fullWidth
                variant='contained'
                startIcon={<AddRoundedIcon />}
                onClick={handleCreateConversation}
                disabled={isLoading || isSending}
                sx={{ borderRadius: '14px', py: 1, textTransform: 'none', fontWeight: 800, bgcolor: '#4f46e5' }}
              >
                Cuộc trò chuyện mới
              </Button>
            </Box>

            <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', p: 1.2 }}>
              {conversations.map((conversation, index) => {
                const isActive = conversation.id === activeConversationId
                const isEditing = conversation.id === editingConversationId

                return (
                  <Box key={conversation.id}>
                    <Box
                      onClick={() => handleSelectConversation(conversation.id)}
                      sx={{
                        px: 1.3,
                        py: 1.2,
                        borderRadius: '18px',
                        border: '1px solid',
                        borderColor: isActive ? 'rgba(79, 70, 229, 0.24)' : 'transparent',
                        bgcolor: isActive ? (theme) => theme.palette.mode === 'dark' ? 'rgba(99, 102, 241, 0.12)' : '#eef2ff' : 'transparent',
                        cursor: isSending ? 'default' : 'pointer',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(148, 163, 184, 0.07)' : 'rgba(15, 23, 42, 0.04)'
                        }
                      }}
                    >
                      {isEditing ? (
                        <TextField
                          autoFocus
                          fullWidth
                          size='small'
                          value={editingTitle}
                          onChange={(event) => setEditingTitle(event.target.value)}
                          onKeyDown={handleTitleKeyDown}
                          onBlur={() => handleSaveTitle(conversation)}
                          onClick={(event) => event.stopPropagation()}
                          inputProps={{ maxLength: 120 }}
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                        />
                      ) : (
                        <Typography
                          noWrap
                          onDoubleClick={(event) => {
                            event.stopPropagation()
                            handleStartEditing(conversation)
                          }}
                          sx={{
                            fontWeight: 800,
                            color: (theme) => theme.palette.mode === 'dark' ? '#f8fafc' : '#0f172a',
                            userSelect: 'none'
                          }}
                        >
                          {normalizeVietnameseText(conversation.title)}
                        </Typography>
                      )}

                      <Typography noWrap sx={{ mt: 0.25, fontSize: '0.8rem', color: (theme) => theme.palette.mode === 'dark' ? '#94a3b8' : '#64748b' }}>
                        {latestPreview(conversation)}
                      </Typography>
                      <Typography sx={{ mt: 0.7, fontSize: '0.72rem', color: (theme) => theme.palette.mode === 'dark' ? '#94a3b8' : '#64748b' }}>
                        {formatConversationTime(conversation.updatedAt)}
                      </Typography>
                    </Box>
                    {index < conversations.length - 1 && (
                      <Divider sx={{ my: 0.65, borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(148, 163, 184, 0.10)' : 'rgba(148, 163, 184, 0.12)' }} />
                    )}
                  </Box>
                )
              })}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  )
}

export default AIChat

