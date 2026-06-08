import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Avatar from '@mui/material/Avatar'
import IconButton from '@mui/material/IconButton'
import Paper from '@mui/material/Paper'
import Button from '@mui/material/Button'
import Tooltip from '@mui/material/Tooltip'
import Chip from '@mui/material/Chip'
import SendIcon from '@mui/icons-material/Send'
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import ForumRoundedIcon from '@mui/icons-material/ForumRounded'
import PhotoRoundedIcon from '@mui/icons-material/PhotoRounded'
import CircularProgress from '@mui/material/CircularProgress'

import VisuallyHiddenInput from '~/components/Form/VisuallyHiddenInput'

const defaultFormatMessageTime = (value) => {
  if (!value) return ''
  return new Date(value).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}

const sanitizeChatContent = (value = '') => {
  return String(value)
    .replace(/^\s*[-*]\s+/gm, '')
    .replace(/^#{1,6}\s*/gm, '')
    .trim()
}

const renderChatContent = (value = '') => {
  return sanitizeChatContent(value)
    .replace(/\*\*(.+?)\*\*/gs, (_, content) => content.trim().toLocaleUpperCase('vi-VN'))
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
}

function ChatBox({
  activeConversation,
  messages = [],
  currentUserName = 'Ban',
  getMessageSenderName,
  isCurrentUserMessage,
  participantFallbackLabel = 'U',
  emptyTitle = 'Chon mot cuoc tro chuyen de bat dau',
  emptyDescription = 'Chon mot cuoc tro chuyen de xem lich su nhan tin va bat dau phan hoi.',
  emptyIcon,
  statusLabel = 'Online',
  statusText = 'Dang san sang tro chuyen theo thoi gian thuc',
  inactiveStatusText = 'Chon mot cuoc tro chuyen de bat dau',
  messageInput,
  onMessageInputChange,
  onMessageInputKeyDown,
  onSendMessage,
  onSelectImage,
  onRemoveSelectedImage,
  onClearMessages,
  selectedImageFile,
  selectedImagePreview,
  messagesEndRef,
  canClearMessages = false,
  canSendMessage = false,
  inputPlaceholder = 'Nhap tin nhan hoac gui hinh anh...',
  disabledInputPlaceholder = 'Chon mot cuoc tro chuyen truoc...',
  uploadAccept = 'image/png,image/jpeg,image/jpg',
  formatMessageTime = defaultFormatMessageTime,
  showImageUpload = true,
  isSending = false
}) {
  const participant = activeConversation?.participant
  const resolvedEmptyIcon = emptyIcon || <ForumRoundedIcon sx={{ fontSize: 34 }} />

  return (
    <Paper elevation={0} sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: '28px', overflow: 'hidden', border: '1px solid', borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(148, 163, 184, 0.14)' : 'rgba(148, 163, 184, 0.18)', bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(8, 15, 29, 0.76)' : 'rgba(255, 255, 255, 0.74)', backdropFilter: 'blur(18px)', boxShadow: '0 22px 60px rgba(15, 23, 42, 0.12)' }}>
      <Box sx={{ px: { xs: 2, md: 2.5 }, py: { xs: 1.75, md: 2 }, borderBottom: '1px solid', borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(148, 163, 184, 0.12)' : 'rgba(148, 163, 184, 0.16)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(15, 23, 42, 0.72)' : 'rgba(248, 250, 252, 0.86)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
          <Avatar src={participant?.avatar} sx={{ width: 46, height: 46, bgcolor: (theme) => theme.palette.mode === 'dark' ? '#38bdf8' : '#0f172a', color: (theme) => theme.palette.mode === 'dark' ? '#06121f' : '#f8fafc' }}>
            {participant?.displayName?.slice(0, 1)?.toUpperCase() || participantFallbackLabel}
          </Avatar>

          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontSize: '1.02rem', fontWeight: 800, color: (theme) => theme.palette.mode === 'dark' ? '#f8fafc' : '#0f172a' }}>
              {participant?.displayName || emptyTitle}
            </Typography>
            <Typography noWrap sx={{ mt: 0.3, fontSize: '0.84rem', color: (theme) => theme.palette.mode === 'dark' ? '#94a3b8' : '#64748b' }}>
              {activeConversation ? statusText : inactiveStatusText}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip
            icon={<FiberManualRecordIcon sx={{ fontSize: '0.72rem !important' }} />}
            label={statusLabel}
            sx={{ display: { xs: 'none', sm: 'inline-flex' }, height: 32, borderRadius: '999px', bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(34, 197, 94, 0.14)' : '#ecfdf5', color: (theme) => theme.palette.mode === 'dark' ? '#86efac' : '#166534', '& .MuiChip-icon': { color: 'inherit' } }}
          />
          <Tooltip title='Xoa toan bo tin nhan'>
            <span>
              <IconButton onClick={onClearMessages} disabled={!canClearMessages} sx={{ width: 42, height: 42, borderRadius: '14px', bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(30, 41, 59, 0.88)' : 'rgba(15, 23, 42, 0.05)', color: (theme) => theme.palette.mode === 'dark' ? '#fca5a5' : '#b91c1c', border: '1px solid', borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(248, 113, 113, 0.14)' : 'rgba(239, 68, 68, 0.12)' }}>
                <DeleteOutlineRoundedIcon />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      </Box>

      <Box sx={{ width: '100%', p: { xs: 1.5, md: 2 }, display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, gap: 1.5, overflowY: 'auto', background: (theme) => theme.palette.mode === 'dark' ? 'linear-gradient(180deg, rgba(15, 23, 42, 0.34) 0%, rgba(8, 15, 29, 0.12) 100%)' : 'linear-gradient(180deg, rgba(248, 250, 252, 0.72) 0%, rgba(241, 245, 249, 0.62) 100%)' }}>
        {!activeConversation && (
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', px: 3 }}>
            <Box sx={{ maxWidth: 420 }}>
              <Box sx={{ width: 72, height: 72, mx: 'auto', mb: 2, borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(56, 189, 248, 0.12)' : '#e0f2fe', color: '#0284c7' }}>
                {resolvedEmptyIcon}
              </Box>
              <Typography sx={{ fontSize: '1.1rem', fontWeight: 800, color: (theme) => theme.palette.mode === 'dark' ? '#f8fafc' : '#0f172a' }}>
                {emptyTitle}
              </Typography>
              <Typography sx={{ mt: 1, lineHeight: 1.7, color: (theme) => theme.palette.mode === 'dark' ? '#94a3b8' : '#64748b' }}>
                {emptyDescription}
              </Typography>
            </Box>
          </Box>
        )}

        {activeConversation && messages.map((chat) => {
          const isMe = isCurrentUserMessage(chat)
          const senderName = isMe ? currentUserName : getMessageSenderName(chat)

          return (
            <Box key={chat._id} sx={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
              <Box sx={{ maxWidth: { xs: '92%', sm: '76%' }, px: 1.8, py: 1.4, borderRadius: isMe ? '22px 22px 8px 22px' : '22px 22px 22px 8px', bgcolor: (theme) => isMe ? (theme.palette.mode === 'dark' ? '#38bdf8' : '#0f172a') : (theme.palette.mode === 'dark' ? 'rgba(30, 41, 59, 0.96)' : '#ffffff'), color: (theme) => isMe ? (theme.palette.mode === 'dark' ? '#06121f' : '#f8fafc') : (theme.palette.mode === 'dark' ? '#e2e8f0' : '#0f172a'), border: '1px solid', borderColor: (theme) => isMe ? (theme.palette.mode === 'dark' ? 'rgba(125, 211, 252, 0.3)' : 'transparent') : (theme.palette.mode === 'dark' ? 'rgba(148, 163, 184, 0.24)' : 'rgba(148, 163, 184, 0.20)'), boxShadow: (theme) => isMe ? (theme.palette.mode === 'dark' ? '0 14px 32px rgba(14, 165, 233, 0.16)' : '0 16px 32px rgba(15, 23, 42, 0.12)') : (theme.palette.mode === 'dark' ? '0 16px 34px rgba(2, 6, 23, 0.28)' : '0 14px 30px rgba(15, 23, 42, 0.08)') }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, mb: 0.8 }}>
                  <Typography sx={{ fontSize: '0.84rem', fontWeight: 800, opacity: 0.92 }}>{senderName}</Typography>
                  <Typography sx={{ fontSize: '0.74rem', opacity: 0.72 }}>{formatMessageTime(chat.createdAt)}</Typography>
                </Box>

                {chat.content && (
                  <Typography
                    sx={{
                      lineHeight: 1.65,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word'
                    }}
                  >
                    {renderChatContent(chat.content)}
                  </Typography>
                )}

                {chat.image && (
                  <Box component='img' src={chat.image} alt='chat-attachment' sx={{ mt: chat.content ? 1.25 : 0.25, width: '100%', maxWidth: 300, borderRadius: '16px', display: 'block', border: '1px solid', borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(148, 163, 184, 0.18)' : 'rgba(44, 62, 80, 0.10)' }} />
                )}
              </Box>
            </Box>
          )
        })}
        <Box ref={messagesEndRef} />
      </Box>

      <Box sx={{ px: { xs: 1.5, md: 2 }, py: { xs: 1.5, md: 1.75 }, borderTop: '1px solid', borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(148, 163, 184, 0.12)' : 'rgba(148, 163, 184, 0.16)', bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(15, 23, 42, 0.82)' : 'rgba(248, 250, 252, 0.86)' }}>
        {selectedImagePreview && (
          <Box sx={{ mb: 1.5, p: 1.2, borderRadius: '18px', bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(56, 189, 248, 0.08)' : '#eff6ff', border: '1px solid', borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(56, 189, 248, 0.18)' : 'rgba(59, 130, 246, 0.14)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1.5 }}>
            <Box sx={{ display: 'flex', gap: 1.25, alignItems: 'flex-start', minWidth: 0 }}>
              <Box component='img' src={selectedImagePreview} alt='selected-preview' sx={{ width: 72, height: 72, objectFit: 'cover', borderRadius: '14px', border: '1px solid', borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(148, 163, 184, 0.16)' : 'rgba(44, 62, 80, 0.10)' }} />
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontSize: '0.92rem', fontWeight: 800, color: (theme) => theme.palette.mode === 'dark' ? '#f8fafc' : '#0f172a' }}>Anh san sang gui</Typography>
                <Typography noWrap sx={{ mt: 0.4, fontSize: '0.8rem', color: (theme) => theme.palette.mode === 'dark' ? '#94a3b8' : '#64748b' }}>{selectedImageFile?.name}</Typography>
              </Box>
            </Box>
            <Button size='small' color='inherit' onClick={onRemoveSelectedImage} sx={{ minWidth: 'auto', color: (theme) => theme.palette.mode === 'dark' ? '#cbd5e1' : '#475569' }}>
              Xoa
            </Button>
          </Box>
        )}

        <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1.25 }}>
          <TextField
            fullWidth
            multiline
            maxRows={4}
            placeholder={activeConversation ? inputPlaceholder : disabledInputPlaceholder}
            variant='outlined'
            value={messageInput}
            onChange={(event) => onMessageInputChange(event.target.value)}
            onKeyDown={onMessageInputKeyDown}
            disabled={!activeConversation || isSending}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '20px', minHeight: 56, py: 0.75, alignItems: 'center', bgcolor: (theme) => theme.palette.mode === 'dark' ? '#081120' : '#ffffff', color: (theme) => theme.palette.mode === 'dark' ? '#f8fafc' : '#0f172a', '& textarea': { paddingTop: 0, paddingBottom: 0 }, '& fieldset': { borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(148, 163, 184, 0.18)' : 'rgba(148, 163, 184, 0.22)' }, '&:hover fieldset': { borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(125, 211, 252, 0.34)' : 'rgba(15, 23, 42, 0.24)' }, '&.Mui-focused fieldset': { borderColor: (theme) => theme.palette.mode === 'dark' ? '#38bdf8' : '#0f172a' } } }}
          />

          {showImageUpload && (
            <Tooltip title='Gui hinh anh'>
              <span>
                <IconButton component='label' disabled={!activeConversation || isSending} sx={{ width: 46, height: 46, borderRadius: '16px', color: (theme) => theme.palette.mode === 'dark' ? '#7dd3fc' : '#0f172a', bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(56, 189, 248, 0.10)' : 'rgba(15, 23, 42, 0.05)', border: '1px solid', borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(56, 189, 248, 0.18)' : 'rgba(15, 23, 42, 0.08)' }}>
                  <PhotoRoundedIcon />
                  <VisuallyHiddenInput type='file' accept={uploadAccept} onChange={onSelectImage} />
                </IconButton>
              </span>
            </Tooltip>
          )}

          <IconButton onClick={onSendMessage} disabled={!canSendMessage || isSending} sx={{ width: 46, height: 46, borderRadius: '16px', bgcolor: (theme) => theme.palette.mode === 'dark' ? '#38bdf8' : '#0f172a', color: (theme) => theme.palette.mode === 'dark' ? '#06121f' : '#f8fafc', opacity: canSendMessage && !isSending ? 1 : 0.6, boxShadow: (theme) => theme.palette.mode === 'dark' ? '0 14px 30px rgba(14, 165, 233, 0.24)' : '0 14px 28px rgba(15, 23, 42, 0.18)', '&:hover': { bgcolor: (theme) => theme.palette.mode === 'dark' ? '#67e8f9' : '#111c31' } }}>
            {isSending ? <CircularProgress size={21} color='inherit' /> : <SendIcon />}
          </IconButton>
        </Box>
      </Box>
    </Paper>
  )
}

export default ChatBox
