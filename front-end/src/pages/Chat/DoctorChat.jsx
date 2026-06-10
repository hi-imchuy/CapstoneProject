import { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Container from '@mui/material/Container'
import Grid from '@mui/material/Grid'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Avatar from '@mui/material/Avatar'
import Paper from '@mui/material/Paper'
import Divider from '@mui/material/Divider'
import ImageIcon from '@mui/icons-material/Image'
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord'
import SmartToyRoundedIcon from '@mui/icons-material/SmartToyRounded'
import HealthAndSafetyRoundedIcon from '@mui/icons-material/HealthAndSafetyRounded'
import { toast } from 'react-toastify'
import { useConfirm } from 'material-ui-confirm'

import AppBar from '~/components/AppBar/AppBar'
import ChatBox from '~/components/ChatBox/ChatBox'
import { singleFileValidator } from '~/utils/validators'
import { USER_ROLE } from '~/utils/constant'
import { selectCurrentUser } from '~/redux/user/userSlice'
import {
  createOrGetConversationAPI,
  deleteConversationMessageAPI,
  fetchContactsAPI,
  fetchConversationsAPI,
  fetchMessagesAPI,
  receiveConversationCreated,
  receiveMessageDeleted,
  receiveMessagesCleared,
  receiveRealtimeMessage,
  selectActiveConversation,
  selectConversationContacts,
  selectConversationList,
  selectMessagesByConversation,
  sendMessageAPI,
  setActiveConversation
} from '~/redux/conversation/conversationSlice'
import { connectChatSocket, disconnectChatSocket } from '~/sockets/chatSocket'

const formatMessageTime = (value) => {
  if (!value) return ''
  return new Date(value).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}

const formatMessagePreview = (conversation) => {
  if (!conversation?.latestMessage) return 'Chua co tin nhan'
  if (conversation.latestMessage.image && !conversation.latestMessage.content) return 'Da gui hinh anh'
  if (conversation.latestMessage.image && conversation.latestMessage.content) return `${conversation.latestMessage.content} - [Anh]`
  return conversation.latestMessage.content
}

function DoctorChat() {
  const dispatch = useDispatch()
  const confirmDeleteMessage = useConfirm()
  const currentUser = useSelector(selectCurrentUser)
  const contacts = useSelector(selectConversationContacts)
  const conversations = useSelector(selectConversationList)
  const activeConversation = useSelector(selectActiveConversation)
  const messagesByConversation = useSelector(selectMessagesByConversation)

  const [messageInput, setMessageInput] = useState('')
  const [selectedImageFile, setSelectedImageFile] = useState(null)
  const [selectedImagePreview, setSelectedImagePreview] = useState('')
  const messagesEndRef = useRef(null)

  const isDoctor = currentUser?.role === USER_ROLE.DOCTOR
  const sidebarTitle = isDoctor ? 'Danh sách bệnh nhân' : 'Danh sách bác sĩ'
  const sidebarSubtitle = isDoctor
    ? `${contacts.length} bệnh nhân có thể trò chuyện`
    : `${contacts.length} bác sĩ có thể trò chuyện`

  const activeMessages = activeConversation ? (messagesByConversation[activeConversation._id] || []) : []

  useEffect(() => {
    if (!currentUser?._id) return

    dispatch(fetchContactsAPI())
    dispatch(fetchConversationsAPI())

    const socket = connectChatSocket()

    const handleConversationCreated = (conversation) => {
      dispatch(receiveConversationCreated(conversation))
    }

    const handleRealtimeMessage = (payload) => {
      dispatch(receiveRealtimeMessage(payload))
    }

    const handleMessagesCleared = (conversation) => {
      dispatch(receiveMessagesCleared(conversation))
    }

    const handleMessageDeleted = (payload) => {
      dispatch(receiveMessageDeleted(payload))
    }

    socket.on('conversation:created', handleConversationCreated)
    socket.on('conversation:message-created', handleRealtimeMessage)
    socket.on('conversation:messages-cleared', handleMessagesCleared)
    socket.on('conversation:message-deleted', handleMessageDeleted)

    return () => {
      socket.off('conversation:created', handleConversationCreated)
      socket.off('conversation:message-created', handleRealtimeMessage)
      socket.off('conversation:messages-cleared', handleMessagesCleared)
      socket.off('conversation:message-deleted', handleMessageDeleted)
      disconnectChatSocket()
    }
  }, [currentUser?._id, dispatch])

  useEffect(() => {
    if (activeConversation?._id) return
    if (!conversations.length) return

    dispatch(setActiveConversation(conversations[0]))
  }, [activeConversation?._id, conversations, dispatch])

  useEffect(() => {
    if (!activeConversation?._id) return

    dispatch(fetchMessagesAPI(activeConversation._id))
    const socket = connectChatSocket()
    socket.emit('conversation:join', activeConversation._id)

    return () => {
      socket.emit('conversation:leave', activeConversation._id)
    }
  }, [activeConversation?._id, dispatch])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [activeConversation?._id, activeMessages.length])

  const readFilePreview = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (event) => resolve(event.target?.result || '')
    reader.onerror = () => reject(new Error('Khong the doc file anh'))
    reader.readAsDataURL(file)
  })

  const handleSelectImage = async (event) => {
    const file = event.target?.files?.[0]
    const error = singleFileValidator(file)

    if (error) {
      toast.error(error)
      event.target.value = ''
      return
    }

    try {
      const preview = await readFilePreview(file)
      setSelectedImageFile(file)
      setSelectedImagePreview(preview)
    } catch (err) {
      toast.error(err.message || 'Khong the xem truoc anh nay')
    } finally {
      event.target.value = ''
    }
  }

  const handleRemoveSelectedImage = () => {
    setSelectedImageFile(null)
    setSelectedImagePreview('')
  }

  const handleSelectContact = async (contact) => {
    const conversation = await dispatch(createOrGetConversationAPI(contact._id)).unwrap()
    dispatch(setActiveConversation(conversation))
  }

  const handleSendMessage = async () => {
    const trimmedMessage = messageInput.trim()
    if (!activeConversation?._id) {
      toast.info('Chọn 1 cuộc trò chuyện để gửi tin nhắn')
      return
    }

    if (!trimmedMessage && !selectedImageFile) return

    const formData = new FormData()
    formData.append('content', trimmedMessage)
    if (selectedImageFile) {
      formData.append('image', selectedImageFile)
    }

    await dispatch(sendMessageAPI({
      conversationId: activeConversation._id,
      formData
    })).unwrap()

    setMessageInput('')
    setSelectedImageFile(null)
    setSelectedImagePreview('')
  }

  const handleDeleteMessage = async (message) => {
    if (!activeConversation?._id || !message?._id) return

    try {
      await confirmDeleteMessage({
        title: 'Xóa tin nhắn này?',
        description: 'Tin nhắn của bạn sẽ bị xóa khỏi cuộc trò chuyện. Hành động này không thể hoàn tác.',
        confirmationText: 'Xóa tin nhắn',
        cancellationText: 'Hủy'
      })
    } catch {
      return
    }

    await dispatch(deleteConversationMessageAPI({
      conversationId: activeConversation._id,
      messageId: message._id
    })).unwrap()
  }

  const handleTextFieldKeyDown = async (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      await handleSendMessage()
    }
  }

  return(
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
            ? 'radial-gradient(circle at top left, rgba(56, 189, 248, 0.16), transparent 26%), radial-gradient(circle at 85% 18%, rgba(59, 130, 246, 0.15), transparent 24%), linear-gradient(180deg, #081120 0%, #0b1628 100%)'
            : 'radial-gradient(circle at top left, rgba(56, 189, 248, 0.14), transparent 24%), radial-gradient(circle at 85% 18%, rgba(59, 130, 246, 0.12), transparent 22%), linear-gradient(180deg, #f8fbff 0%, #eef4fb 100%)'
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
            activeConversation={activeConversation}
            messages={activeMessages}
            currentUserName='Ban'
            getMessageSenderName={() => activeConversation?.participant?.displayName || 'Nguoi dung'}
            isCurrentUserMessage={(chat) => chat.sender === currentUser?.role}
            participantFallbackLabel={isDoctor ? 'P' : 'D'}
            emptyTitle='Chon mot cuoc tro chuyen de bat dau'
            emptyDescription={isDoctor
              ? 'Chon benh nhan o khung ben phai de xem lich su nhan tin va phan hoi ngay.'
              : 'Chon bac si o khung ben phai de nhan tu van va gui hinh anh nhanh hon.'}
            messageInput={messageInput}
            onMessageInputChange={setMessageInput}
            onMessageInputKeyDown={handleTextFieldKeyDown}
            onSendMessage={handleSendMessage}
            onSelectImage={handleSelectImage}
            onRemoveSelectedImage={handleRemoveSelectedImage}
            onDeleteMessage={handleDeleteMessage}
            canDeleteMessage={(chat) => chat.sender === currentUser?.role}
            selectedImageFile={selectedImageFile}
            selectedImagePreview={selectedImagePreview}
            messagesEndRef={messagesEndRef}
            canSendMessage={Boolean(activeConversation && (messageInput.trim() || selectedImageFile))}
          />
        </Grid>

        <Grid
          size={{ xs: 12, md: 3 }}
          sx={{
            minHeight: 0,
            display: 'flex'
          }}
        >
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
            <Box
              sx={{
                px: 2,
                py: 2,
                borderBottom: '1px solid',
                borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(148, 163, 184, 0.12)' : 'rgba(148, 163, 184, 0.16)',
                bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(15, 23, 42, 0.72)' : 'rgba(248, 250, 252, 0.86)'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.25 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(56, 189, 248, 0.12)' : '#e0f2fe',
                    color: '#0284c7'
                  }}
                >
                  {isDoctor ? <HealthAndSafetyRoundedIcon /> : <SmartToyRoundedIcon />}
                </Box>
                <Box>
                  <Typography sx={{ fontSize: '1rem', lineHeight: 1.18, fontWeight: 700, letterSpacing: '-0.015em', color: (theme) => theme.palette.mode === 'dark' ? '#f8fafc' : '#0f172a' }}>
                    {sidebarTitle}
                  </Typography>
                  <Typography sx={{ fontSize: '0.8rem', color: (theme) => theme.palette.mode === 'dark' ? '#94a3b8' : '#64748b' }}>
                    {sidebarSubtitle}
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', p: 1.2 }}>
              {contacts.map((contact, index) => {
                const conversation = conversations.find(item => String(item.participant?._id) === String(contact._id))
                const isActive = String(activeConversation?.participant?._id) === String(contact._id)

                return (
                  <Box key={contact._id}>
                    <Box
                      onClick={() => handleSelectContact(contact)}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.25,
                        px: 1.2,
                        py: 1.1,
                        borderRadius: '20px',
                        border: '1px solid',
                        borderColor: (theme) => {
                          if (!isActive) return 'transparent'
                          return theme.palette.mode === 'dark' ? 'rgba(56, 189, 248, 0.20)' : 'rgba(59, 130, 246, 0.14)'
                        },
                        bgcolor: (theme) => {
                          if (!isActive) return 'transparent'
                          return theme.palette.mode === 'dark' ? 'rgba(56, 189, 248, 0.08)' : '#f8fbff'
                        },
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(148, 163, 184, 0.07)' : 'rgba(15, 23, 42, 0.04)'
                        }
                      }}
                    >
                      <Avatar src={contact.avatar} sx={{ bgcolor: (theme) => theme.palette.mode === 'dark' ? '#38bdf8' : '#0f172a', color: (theme) => theme.palette.mode === 'dark' ? '#06121f' : '#f8fafc', width: 46, height: 46 }}>
                        {contact.displayName?.slice(0, 1)?.toUpperCase()}
                      </Avatar>

                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ lineHeight: 1.18, fontWeight: 700, letterSpacing: '-0.015em', color: (theme) => theme.palette.mode === 'dark' ? '#f8fafc' : '#0f172a' }}>
                          {contact.displayName}
                        </Typography>
                        <Typography noWrap sx={{ mt: 0.25, fontSize: '0.8rem', color: (theme) => theme.palette.mode === 'dark' ? '#94a3b8' : '#64748b' }}>
                          {formatMessagePreview(conversation)}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
                        {conversation?.latestMessage?.createdAt && (
                          <Typography sx={{ fontSize: '0.72rem', color: (theme) => theme.palette.mode === 'dark' ? '#94a3b8' : '#64748b' }}>
                            {formatMessageTime(conversation.latestMessage.createdAt)}
                          </Typography>
                        )}
                        <FiberManualRecordIcon sx={{ fontSize: '0.7rem', color: '#4ade80' }} />
                      </Box>
                    </Box>
                    {index < contacts.length - 1 && <Divider sx={{ my: 0.7, borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(148, 163, 184, 0.10)' : 'rgba(148, 163, 184, 0.12)' }} />}
                  </Box>
                )
              })}

              {!contacts.length && (
                <Box sx={{ px: 1, py: 3, textAlign: 'center' }}>
                  <Box
                    sx={{
                      width: 58,
                      height: 58,
                      mx: 'auto',
                      mb: 1.2,
                      borderRadius: '18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(56, 189, 248, 0.10)' : '#eff6ff',
                      color: '#0284c7'
                    }}
                  >
                    <ImageIcon />
                  </Box>
                  <Typography sx={{ fontWeight: 700, color: (theme) => theme.palette.mode === 'dark' ? '#f8fafc' : '#0f172a' }}>
                    Chua co nguoi dung phu hop
                  </Typography>
                  <Typography sx={{ mt: 0.8, color: (theme) => theme.palette.mode === 'dark' ? '#94a3b8' : '#64748b' }}>
                    He thong chua tim thay doi tuong de bat dau tro chuyen.
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  )
}

export default DoctorChat
