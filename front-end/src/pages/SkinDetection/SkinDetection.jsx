import { useEffect, useMemo, useRef, useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Container from '@mui/material/Container'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Divider from '@mui/material/Divider'
import Grid from '@mui/material/Grid'
import IconButton from '@mui/material/IconButton'
import LinearProgress from '@mui/material/LinearProgress'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import CloudUploadRoundedIcon from '@mui/icons-material/CloudUploadRounded'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import ImageSearchRoundedIcon from '@mui/icons-material/ImageSearchRounded'
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded'
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import ZoomInRoundedIcon from '@mui/icons-material/ZoomInRounded'
import ZoomOutRoundedIcon from '@mui/icons-material/ZoomOutRounded'
import SmartToyRoundedIcon from '@mui/icons-material/SmartToyRounded'
import SendRoundedIcon from '@mui/icons-material/SendRounded'
import { useConfirm } from 'material-ui-confirm'
import AppBar from '~/components/AppBar/AppBar'
import ChatBox from '~/components/ChatBox/ChatBox'
import {
  createAIConversationAPI,
  createSkinDetectionAPI,
  deleteSkinDetectionAPI,
  fetchSkinDetectionsAPI,
  generateSkinDetectionQuestionsAPI,
  sendAIMessageAPI
} from '~/apis'

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png']
const MIN_IMAGE_ZOOM = 0.5
const MAX_IMAGE_ZOOM = 4
const IMAGE_ZOOM_STEP = 0.25
const DEFAULT_AI_TITLE = 'Cuộc trò chuyện mới'
const AI_PARTICIPANT = {
  displayName: 'Trợ lý AI',
  avatar: ''
}

const DISEASE_NAME_MAP = {
  'dermatological-diseases': 'Bệnh Da Liễu',
  BenhLyNiemMacMieng: 'Bệnh Lý Niêm Mạc Miệng',
  GiangMai: 'Giang Mai',
  MayDay: 'Mày Đay',
  MunCoc: 'Mụn Cóc',
  MunTrungCa: 'Mụn Trứng Cá',
  VayNen: 'Vảy Nến',
  ViemDaCoDia: 'Viêm Da Cơ Địa',
  ZonaThanKinh: 'Zona Thần Kinh'
}

const getVietnameseDiseaseName = (diseaseName) => {
  const normalizedName = String(diseaseName || '').trim()
  return DISEASE_NAME_MAP[normalizedName] || normalizedName
}

function SkinDetection() {
  const confirmDeleteHistory = useConfirm()
  const fileInputRef = useRef(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [isDetecting, setIsDetecting] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [deletingHistoryId, setDeletingHistoryId] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [result, setResult] = useState(null)
  const [history, setHistory] = useState([])
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false)
  const [imageZoom, setImageZoom] = useState(1)
  const [viewerImageUrl, setViewerImageUrl] = useState('')
  const [suggestedQuestions, setSuggestedQuestions] = useState([])
  const [customQuestionInput, setCustomQuestionInput] = useState('')
  const [isLoadingSuggestedQuestions, setIsLoadingSuggestedQuestions] = useState(false)
  const [suggestedQuestionsError, setSuggestedQuestionsError] = useState('')
  const [embeddedConversation, setEmbeddedConversation] = useState(null)
  const [embeddedMessages, setEmbeddedMessages] = useState([])
  const [embeddedMessageInput, setEmbeddedMessageInput] = useState('')
  const [isEmbeddedChatOpen, setIsEmbeddedChatOpen] = useState(false)
  const [isEmbeddedSending, setIsEmbeddedSending] = useState(false)
  const embeddedMessagesEndRef = useRef(null)
  const suggestedQuestionsRequestRef = useRef(0)

  const hasDetections = Boolean(result?.cac_benh_nhan_dien?.length)
  const embeddedChatConversation = embeddedConversation
    ? { ...embeddedConversation, participant: AI_PARTICIPANT }
    : null

  const sortedHistory = useMemo(() => {
    return [...history].sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0))
  }, [history])

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  useEffect(() => {
    loadHistory()
  }, [])

  useEffect(() => {
    embeddedMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [embeddedMessages.length, isEmbeddedSending])

  const resetSuggestedQuestions = () => {
    suggestedQuestionsRequestRef.current += 1
    setSuggestedQuestions([])
    setCustomQuestionInput('')
    setSuggestedQuestionsError('')
    setIsLoadingSuggestedQuestions(false)
  }

  const resetEmbeddedChat = () => {
    setEmbeddedConversation(null)
    setEmbeddedMessages([])
    setEmbeddedMessageInput('')
    setIsEmbeddedChatOpen(false)
    setIsEmbeddedSending(false)
  }

  const normalizeConversation = (conversation) => ({
    ...conversation,
    id: conversation._id
  })

  const getDetectedDiseaseNames = (detections = result?.cac_benh_nhan_dien || []) => {
    return detections
      .map((item) => getVietnameseDiseaseName(item.ten_benh))
      .filter(Boolean)
  }

  const buildAdviceConversationTitle = (detections = result?.cac_benh_nhan_dien || []) => {
    const diseaseNames = getDetectedDiseaseNames(detections)
    if (!diseaseNames.length) return DEFAULT_AI_TITLE
    return `Tư vấn: ${diseaseNames.slice(0, 2).join(', ')}${diseaseNames.length > 2 ? '...' : ''}`
  }

  const loadSuggestedQuestions = async (detectionResult) => {
    const detections = detectionResult?.cac_benh_nhan_dien || []
    if (!detections.length) return

    const requestId = suggestedQuestionsRequestRef.current + 1
    suggestedQuestionsRequestRef.current = requestId
    setIsLoadingSuggestedQuestions(true)
    setSuggestedQuestionsError('')
    try {
      const data = await generateSkinDetectionQuestionsAPI({ detections })
      if (suggestedQuestionsRequestRef.current !== requestId) return
      setSuggestedQuestions(Array.isArray(data?.questions) ? data.questions : [])
    } catch {
      if (suggestedQuestionsRequestRef.current !== requestId) return
      setSuggestedQuestions([])
      setSuggestedQuestionsError('Không tạo được câu hỏi gợi ý lúc này.')
    } finally {
      if (suggestedQuestionsRequestRef.current === requestId) {
        setIsLoadingSuggestedQuestions(false)
      }
    }
  }

  const loadHistory = async () => {
    setIsLoadingHistory(true)
    try {
      const data = await fetchSkinDetectionsAPI()
      setHistory(Array.isArray(data) ? data : [])
    } catch {
      setErrorMessage('Không tải được lịch sử nhận diện')
    } finally {
      setIsLoadingHistory(false)
    }
  }

  const handleFileChange = (file) => {
    setErrorMessage('')
    setResult(null)
    resetSuggestedQuestions()
    resetEmbeddedChat()

    if (!file) return

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setErrorMessage('Chỉ chấp nhận ảnh JPG, JPEG hoặc PNG')
      return
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  const handleDrop = (event) => {
    event.preventDefault()
    setIsDragging(false)
    handleFileChange(event.dataTransfer.files?.[0])
  }

  const handleDetect = async () => {
    if (!selectedFile || isDetecting) return

    setIsDetecting(true)
    setErrorMessage('')

    const formData = new FormData()
    formData.append('image', selectedFile)

    try {
      const data = await createSkinDetectionAPI(formData)
      setResult(data)
      resetSuggestedQuestions()
      resetEmbeddedChat()
      setHistory((currentHistory) => [data, ...currentHistory])
      loadSuggestedQuestions(data)
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      setSelectedFile(null)
      setPreviewUrl('')
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (error) {
      setErrorMessage(error?.response?.data?.message || 'Nhận diện ảnh thất bại')
    } finally {
      setIsDetecting(false)
    }
  }

  const handleReset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setSelectedFile(null)
    setPreviewUrl('')
    setResult(null)
    setErrorMessage('')
    resetSuggestedQuestions()
    resetEmbeddedChat()
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleOpenImageViewer = (imageUrl = result?.url_anh_ket_qua) => {
    if (!imageUrl) return
    setViewerImageUrl(imageUrl)
    setImageZoom(1)
    setIsImageViewerOpen(true)
  }

  const handleCloseImageViewer = () => {
    setIsImageViewerOpen(false)
    setViewerImageUrl('')
    setImageZoom(1)
  }

  const changeImageZoom = (amount) => {
    setImageZoom((currentZoom) => (
      Math.min(MAX_IMAGE_ZOOM, Math.max(MIN_IMAGE_ZOOM, currentZoom + amount))
    ))
  }

  const handleImageViewerWheel = (event) => {
    event.preventDefault()
    changeImageZoom(event.deltaY < 0 ? IMAGE_ZOOM_STEP : -IMAGE_ZOOM_STEP)
  }

  const handleDeleteHistoryItem = async (detectionId) => {
    if (!detectionId || deletingHistoryId) return

    try {
      await confirmDeleteHistory({
        title: 'Xóa lịch sử nhận diện?',
        description: 'Kết quả nhận diện này sẽ bị xóa khỏi lịch sử. Hành động này không thể hoàn tác.',
        confirmationText: 'Xóa lịch sử',
        cancellationText: 'Hủy'
      })
    } catch {
      return
    }

    setDeletingHistoryId(detectionId)
    setErrorMessage('')

    try {
      await deleteSkinDetectionAPI(detectionId)
      setHistory((currentHistory) => currentHistory.filter((item) => item._id !== detectionId))
    } catch (error) {
      setErrorMessage(error?.response?.data?.message || 'Xóa lịch sử nhận diện thất bại')
    } finally {
      setDeletingHistoryId('')
    }
  }

  const sendEmbeddedMessage = async (conversation, content) => {
    const conversationId = conversation?.id || conversation?._id
    const trimmedContent = String(content || '').trim()
    if (!conversationId || !trimmedContent || isEmbeddedSending) return

    const optimisticMessage = {
      _id: `temp-${Date.now()}`,
      conversationId,
      role: 'user',
      content: trimmedContent,
      createdAt: Date.now()
    }

    setEmbeddedMessageInput('')
    setIsEmbeddedSending(true)
    setEmbeddedMessages((currentMessages) => [...currentMessages, optimisticMessage])

    try {
      const response = await sendAIMessageAPI(conversationId, trimmedContent)
      const nextConversation = normalizeConversation(response.conversation)
      setEmbeddedConversation(nextConversation)
      setEmbeddedMessages((currentMessages) => [
        ...currentMessages.filter((message) => message._id !== optimisticMessage._id),
        ...response.messages
      ])
    } catch {
      setEmbeddedMessages((currentMessages) => currentMessages.filter(
        (message) => message._id !== optimisticMessage._id
      ))
      setEmbeddedMessageInput(trimmedContent)
      setErrorMessage('Gửi câu hỏi đến trợ lý AI thất bại.')
    } finally {
      setIsEmbeddedSending(false)
    }
  }

  const handleSuggestedQuestionClick = async (question) => {
    if (isEmbeddedSending) return

    setErrorMessage('')
    setIsEmbeddedChatOpen(true)
    setEmbeddedMessageInput('')

    try {
      if (embeddedConversation) {
        await sendEmbeddedMessage(embeddedConversation, question)
        return
      }

      setEmbeddedMessages([])
      const createdConversation = await createAIConversationAPI({
        title: buildAdviceConversationTitle(result?.cac_benh_nhan_dien)
      })
      const normalizedConversation = normalizeConversation(createdConversation)
      setEmbeddedConversation(normalizedConversation)
      await sendEmbeddedMessage(normalizedConversation, question)
    } catch {
      setIsEmbeddedChatOpen(false)
      setEmbeddedConversation(null)
      setErrorMessage('Không tạo được cuộc trò chuyện AI mới.')
    }
  }

  const handleCustomQuestionSubmit = async (event) => {
    event?.preventDefault()
    const trimmedQuestion = customQuestionInput.trim()
    if (!trimmedQuestion || isEmbeddedSending) return

    setCustomQuestionInput('')
    await handleSuggestedQuestionClick(trimmedQuestion)
  }

  const handleEmbeddedSendMessage = async () => {
    await sendEmbeddedMessage(embeddedConversation, embeddedMessageInput)
  }

  const handleEmbeddedInputKeyDown = async (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      await handleEmbeddedSendMessage()
    }
  }

  const renderDetections = (detections = [], options = {}) => {
    const isCompact = Boolean(options.compact)

    if (!detections.length) {
      return (
        <Alert
          severity="info"
          sx={{
            width: '100%',
            maxWidth: isCompact ? '100%' : undefined,
            minHeight: isCompact ? 48 : undefined,
            height: isCompact ? 'auto' : undefined,
            alignItems: 'center',
            borderRadius: isCompact ? 3 : 2,
            py: isCompact ? 0.4 : undefined,
            fontSize: isCompact ? '0.78rem' : undefined,
            bgcolor: isCompact ? 'rgba(14, 165, 233, 0.10)' : undefined,
            '& .MuiAlert-message': {
              width: '100%',
              whiteSpace: 'normal',
              overflowWrap: 'anywhere',
              lineHeight: 1.35
            }
          }}
        >
          Không phát hiện bệnh da liễu trong ảnh này.
        </Alert>
      )
    }

    return (
      <Stack spacing={isCompact ? 0.8 : 1.2}>
        {detections.map((item, index) => (
          <Box
            key={`${item.ten_benh}-${index}`}
          sx={{
              p: isCompact ? 1.1 : 1.5,
              width: '100%',
              minWidth: isCompact ? 0 : undefined,
              maxWidth: '100%',
              boxSizing: 'border-box',
              minHeight: isCompact ? 64 : undefined,
              borderRadius: isCompact ? 3 : 2,
              border: isCompact ? '1px solid rgba(37, 99, 235, 0.10)' : '1px solid rgba(15, 23, 42, 0.10)',
              bgcolor: isCompact ? 'linear-gradient(135deg, #ffffff 0%, #f8fbff 100%)' : 'background.paper',
              boxShadow: isCompact ? '0 8px 18px rgba(15, 23, 42, 0.06)' : undefined,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1} sx={{ width: '100%', minWidth: 0 }}>
              <Typography
                noWrap={!isCompact}
                sx={{
                  fontWeight: 600,
                  color: '#0f172a',
                  fontSize: isCompact ? '0.8rem' : undefined,
                  minWidth: 0,
                  flex: 1,
                  wordBreak: 'break-word'
                }}
              >
                {getVietnameseDiseaseName(item.ten_benh)}
              </Typography>
              <Chip
                label={`${Number(item.do_chinh_xac || 0).toFixed(2)}%`}
                color="primary"
                size="small"
                sx={{
                  height: isCompact ? 22 : undefined,
                  minWidth: isCompact ? 74 : undefined,
                  flexShrink: 0,
                  fontWeight: 600,
                  fontSize: isCompact ? '0.72rem' : undefined,
                  bgcolor: isCompact ? '#1e3a5f' : undefined
                }}
              />
            </Stack>
            <LinearProgress
              variant="determinate"
              value={Math.min(Number(item.do_chinh_xac || 0), 100)}
              sx={{ mt: isCompact ? 0.8 : 1.2, height: isCompact ? 5 : 7, borderRadius: 999 }}
            />
          </Box>
        ))}
      </Stack>
    )
  }

  const renderSuggestedQuestions = () => {
    if (!hasDetections) return null

    return (
      <Box>
        <Typography sx={{ mb: 1, fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>
          Câu hỏi gợi ý
        </Typography>

        {isLoadingSuggestedQuestions && (
          <CircularProgress size={16} sx={{ mb: 1 }} />
        )}

        {suggestedQuestionsError && (
          <Alert severity="warning" sx={{ mb: 1, borderRadius: 2 }}>
            {suggestedQuestionsError}
          </Alert>
        )}

        {!!suggestedQuestions.length && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {suggestedQuestions.map((question, index) => (
              <Button
                key={`${question}-${index}`}
                variant="outlined"
                onClick={() => handleSuggestedQuestionClick(question)}
                disabled={isEmbeddedSending}
                sx={{
                  justifyContent: 'flex-start',
                  textAlign: 'left',
                  minHeight: 42,
                  width: 'fit-content',
                  maxWidth: '100%',
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 400,
                  color: '#0f172a',
                  borderColor: 'rgba(2, 132, 199, 0.28)',
                  bgcolor: '#f8fafc',
                  '&:hover': {
                    borderColor: '#0284c7',
                    bgcolor: '#eef8ff'
                  }
                }}
              >
                {question}
              </Button>
            ))}
          </Box>
        )}

        <Box
          component="form"
          onSubmit={handleCustomQuestionSubmit}
          sx={{
            mt: 1.5,
            display: 'flex',
            gap: 1,
            alignItems: 'stretch',
            flexDirection: { xs: 'column', sm: 'row' }
          }}
        >
          <TextField
            fullWidth
            size="small"
            value={customQuestionInput}
            onChange={(event) => setCustomQuestionInput(event.target.value)}
            placeholder="Nhập câu hỏi của bạn..."
            disabled={isEmbeddedSending}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                bgcolor: '#ffffff'
              }
            }}
          />
          <Button
            type="submit"
            variant="contained"
            startIcon={<SendRoundedIcon />}
            disabled={!customQuestionInput.trim() || isEmbeddedSending}
            sx={{
              minHeight: 40,
              px: 2.5,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              bgcolor: '#0284c7',
              whiteSpace: 'nowrap',
              '&:hover': {
                bgcolor: '#0369a1'
              }
            }}
          >
            Gửi câu hỏi
          </Button>
        </Box>
      </Box>
    )
  }

  return (
    <Container
      disableGutters
      maxWidth={false}
      sx={{
        minHeight: '100vh',
        bgcolor: (theme) => theme.palette.mode === 'dark' ? '#2C3E50' : '#f5f7fb',
        fontFamily: (theme) => theme.typography.fontFamily,
        '& .MuiTypography-root, & .MuiButton-root, & .MuiChip-root, & .MuiAlert-root': {
          fontFamily: 'inherit'
        }
      }}
    >
      <AppBar />

      <Box sx={{ maxWidth: 1240, mx: 'auto', px: { xs: 2, md: 4 }, py: { xs: 3, md: 5 } }}>
        <Stack spacing={1.2} sx={{ mb: 3 }}>
          <Chip
            icon={<ImageSearchRoundedIcon />}
            label="AI Skin Detection"
            sx={{
              width: 'fit-content',
              fontWeight: 600,
              borderRadius: 2,
              backgroundColor: 'white',
              border: (theme) => theme.palette.mode === 'light' ? '1px solid rgba(44, 62, 80, 0.18)' : '1px solid rgba(255, 255, 255, 0.34)',
              color: '#0f172a',
              '& .MuiChip-icon': {
                color: '#0284c7'
              }
            }}
          />
          <Typography variant="h4" sx={{ fontWeight: 700, color: (theme) => theme.palette.mode === 'dark' ? '#f8fafc' : '#0f172a' }}>
            Nhận diện bệnh da liễu
          </Typography>
          <Typography sx={{ maxWidth: 720, color: (theme) => theme.palette.mode === 'dark' ? '#cbd5e1' : '#64748b', lineHeight: 1.7 }}>
            Tải ảnh vùng da cần kiểm tra, sau đó bấm Nhận diện để hệ thống phân tích.
          </Typography>
        </Stack>

        <Grid container spacing={3}>
          <Grid item xs={12} md={7} sx={{ display: 'flex' }}>
            <Paper
              sx={{
                width: '100%',
                height: { xs: 'auto', md: 510 },
                p: { xs: 2, md: 3 },
                borderRadius: 2,
                bgcolor: (theme) => theme.palette.mode === 'dark' ? '#f5f7fb' : '#ffffff',
                boxShadow: '0 18px 45px rgba(15, 23, 42, 0.08)'
              }}
            >
              <Box
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(event) => {
                  event.preventDefault()
                  setIsDragging(true)
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                sx={{
                  height: { xs: 300, md: 360 },
                  border: '2px dashed',
                  borderColor: isDragging ? '#0284c7' : 'rgba(100, 116, 139, 0.35)',
                  borderRadius: 2,
                  bgcolor: isDragging ? 'rgba(14, 165, 233, 0.08)' : '#f8fafc',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  transition: '0.2s ease'
                }}
              >
                <input
                  ref={fileInputRef}
                  hidden
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  onChange={(event) => handleFileChange(event.target.files?.[0])}
                />

                {previewUrl ? (
                  <Box
                    component="img"
                    src={previewUrl}
                    alt="Xem trước ảnh cần nhận diện"
                    sx={{ width: '100%', height: '100%', objectFit: 'contain', bgcolor: '#0f172a', display: 'block' }}
                  />
                ) : (
                  <Stack spacing={1.5} alignItems="center" sx={{ px: 3, textAlign: 'center' }}>
                    <CloudUploadRoundedIcon sx={{ fontSize: 64, color: '#0284c7' }} />
                    <Typography sx={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
                      Kéo thả ảnh vào đây hoặc bấm để chọn
                    </Typography>
                    <Typography sx={{ color: '#64748b' }}>
                      Hỗ trợ JPG, JPEG, PNG. Ảnh chỉ được gửi lên server khi bấm Nhận diện.
                    </Typography>
                  </Stack>
                )}
              </Box>

              {errorMessage && (
                <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>
                  {errorMessage}
                </Alert>
              )}

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 2 }}>
                <Button
                  variant="contained"
                  size="large"
                  disabled={!selectedFile || isDetecting}
                  onClick={handleDetect}
                  startIcon={isDetecting ? <CircularProgress size={18} color="inherit" /> : <ImageSearchRoundedIcon />}
                  sx={{
                    minHeight: 48,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    bgcolor: (theme) => theme.palette.mode === 'dark' ? '#0284c7' : '#2C3E50',
                    color: '#ffffff',
                    boxShadow: (theme) => theme.palette.mode === 'dark' ? '0 12px 24px rgba(2, 132, 199, 0.28)' : undefined,
                    '&:hover': {
                      bgcolor: (theme) => theme.palette.mode === 'dark' ? '#0369a1' : '#1f2f3f'
                    },
                    '&.Mui-disabled': {
                      bgcolor: (theme) => theme.palette.mode === 'dark' ? '#dbeafe' : 'rgba(44, 62, 80, 0.22)',
                      color: (theme) => theme.palette.mode === 'dark' ? '#2563eb' : 'rgba(44, 62, 80, 0.56)'
                    }
                  }}
                >
                  {isDetecting ? 'Đang nhận diện...' : 'Nhận diện'}
                </Button>
                {selectedFile && !isDetecting && (
                  <Button
                    variant="outlined"
                    size="large"
                    disabled={isDetecting}
                    onClick={handleReset}
                    startIcon={<RestartAltRoundedIcon />}
                    sx={{ minHeight: 48, borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                  >
                    Chọn ảnh khác
                  </Button>
                )}
              </Stack>
            </Paper>
          </Grid>

          <Grid item xs={12} md={5} sx={{ display: 'flex' }}>
            <Paper
              sx={{
                width: '100%',
                height: { xs: 'auto', md: 510 },
                p: { xs: 2, md: 3 },
                borderRadius: 2,
                bgcolor: (theme) => theme.palette.mode === 'dark' ? '#f5f7fb' : '#ffffff',
                boxShadow: '0 18px 45px rgba(15, 23, 42, 0.08)',
                overflow: 'hidden'
              }}
            >
              <Stack spacing={2} sx={{ height: '100%', minHeight: 0 }}>
                <Box>
                  <Typography sx={{ fontWeight: 700, color: '#0f172a', fontSize: '1.1rem' }}>
                    Kết quả phân tích
                  </Typography>
                  <Typography sx={{ mt: 0.5, color: '#64748b' }}>
                    Ảnh đã khoanh vùng và danh sách bệnh sẽ hiển thị sau khi xử lý.
                  </Typography>
                </Box>

                {!result && (
                  <Box
                    sx={{
                      minHeight: 320,
                      borderRadius: 2,
                      bgcolor: '#f8fafc',
                      border: '1px solid rgba(100, 116, 139, 0.16)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center',
                      px: 3
                    }}
                  >
                    <Typography sx={{ color: '#64748b' }}>
                      Chưa có kết quả. Hãy chọn ảnh và bấm Nhận diện.
                    </Typography>
                  </Box>
                )}

                {result && (
                  <Stack spacing={1.5} sx={{ flex: 1, minHeight: 0 }}>
                    <Box
                      onClick={() => handleOpenImageViewer(result.url_anh_ket_qua)}
                      sx={{
                        height: 190,
                        flexShrink: 0,
                        borderRadius: 2,
                        bgcolor: '#0f172a',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'zoom-in',
                        position: 'relative',
                        '&::after': {
                          content: '"Bấm để xem ảnh"',
                          position: 'absolute',
                          inset: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: 'rgba(15, 23, 42, 0.42)',
                          color: '#ffffff',
                          fontWeight: 700,
                          opacity: 0,
                          transition: 'opacity 0.18s ease'
                        },
                        '&:hover::after': {
                          opacity: 1
                        }
                      }}
                    >
                      <Box
                        component="img"
                        src={result.url_anh_ket_qua}
                        alt="Ảnh kết quả nhận diện"
                        sx={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                      />
                    </Box>
                    <Alert severity={hasDetections ? 'success' : 'info'} sx={{ borderRadius: 2 }}>
                      {result.message || (hasDetections ? 'Nhận diện thành công' : 'Không phát hiện bệnh da liễu')}
                    </Alert>
                    <Box sx={{ minHeight: 0, overflowY: 'auto', pr: 0.5 }}>
                      {renderDetections(result.cac_benh_nhan_dien)}
                    </Box>
                  </Stack>
                )}
              </Stack>
            </Paper>
          </Grid>

        </Grid>

        {hasDetections && (
          <Paper
            sx={{
              mt: 3,
              px: { xs: 2, md: 3 },
              py: { xs: 1.5, md: 2 },
              borderRadius: 2,
              bgcolor: (theme) => theme.palette.mode === 'dark' ? '#f5f7fb' : '#ffffff',
              boxShadow: '0 18px 45px rgba(15, 23, 42, 0.08)'
            }}
          >
            {renderSuggestedQuestions()}
          </Paper>
        )}

        {isEmbeddedChatOpen && (
          <Box sx={{ mt: 3, width: '100%', height: { xs: 560, md: 600 }, minHeight: 0 }}>
            <ChatBox
              activeConversation={embeddedChatConversation}
              messages={embeddedMessages}
              currentUserName='Bạn'
              getMessageSenderName={() => 'Trợ lý AI'}
              isCurrentUserMessage={(message) => message.role === 'user'}
              participantFallbackLabel='AI'
              emptyTitle='Trợ lý AI'
              emptyDescription='Chọn một câu hỏi gợi ý để bắt đầu tư vấn theo kết quả nhận diện.'
              emptyIcon={<SmartToyRoundedIcon sx={{ fontSize: 34 }} />}
              statusLabel={isEmbeddedSending ? 'Đang trả lời' : 'Sẵn sàng'}
              inactiveStatusText='Sẵn sàng tư vấn'
              messageInput={embeddedMessageInput}
              onMessageInputChange={setEmbeddedMessageInput}
              onMessageInputKeyDown={handleEmbeddedInputKeyDown}
              onSendMessage={handleEmbeddedSendMessage}
              messagesEndRef={embeddedMessagesEndRef}
              canSendMessage={Boolean(embeddedConversation && embeddedMessageInput.trim() && !isEmbeddedSending)}
              inputPlaceholder='Nhập câu hỏi tiếp theo...'
              disabledInputPlaceholder='Chọn một câu hỏi gợi ý trước...'
              showImageUpload={false}
              isSending={isEmbeddedSending}
            />
          </Box>
        )}

        <Paper sx={{ mt: 3, p: { xs: 2, md: 3 }, borderRadius: 2, bgcolor: (theme) => theme.palette.mode === 'dark' ? '#f5f7fb' : '#ffffff', boxShadow: '0 18px 45px rgba(15, 23, 42, 0.08)' }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2} sx={{ mb: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <HistoryRoundedIcon sx={{ color: '#0284c7' }} />
              <Typography sx={{ fontWeight: 700, color: '#0f172a', fontSize: '1.1rem' }}>
                Lịch sử nhận diện
              </Typography>
            </Stack>
            {isLoadingHistory && <CircularProgress size={22} />}
          </Stack>

          {!sortedHistory.length && !isLoadingHistory && (
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              Chưa có lịch sử nhận diện.
            </Alert>
          )}

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, minmax(0, 1fr))',
                md: 'repeat(4, minmax(0, 1fr))'
              },
              gap: 2,
              alignItems: 'start'
            }}
          >
            {sortedHistory.map((item) => (
              <Box key={item._id} sx={{ width: '100%', minWidth: 0 }}>
                <Box
                  sx={{
                    width: '100%',
                    height: 330,
                    borderRadius: 3,
                    border: '1px solid rgba(100, 116, 139, 0.14)',
                    overflow: 'hidden',
                    bgcolor: '#ffffff',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 12px 30px rgba(15, 23, 42, 0.08)',
                    transition: 'transform 0.18s ease, box-shadow 0.18s ease',
                    '&:hover': {
                      transform: 'translateY(-3px)',
                      boxShadow: '0 18px 42px rgba(15, 23, 42, 0.13)'
                    }
                  }}
                >
                  <Box
                    onClick={() => handleOpenImageViewer(item.url_anh_ket_qua)}
                    sx={{
                      position: 'relative',
                      height: 170,
                      flexShrink: 0,
                      bgcolor: '#0f172a',
                      overflow: 'hidden',
                      cursor: 'zoom-in',
                      '&::before': {
                        content: '"Bấm để xem ảnh"',
                        position: 'absolute',
                        inset: 0,
                        zIndex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: 'rgba(15, 23, 42, 0.42)',
                        color: '#ffffff',
                        fontWeight: 700,
                        opacity: 0,
                        transition: 'opacity 0.18s ease'
                      },
                      '&:hover::before': {
                        opacity: 1
                      }
                    }}
                  >
                    <Box
                      component="img"
                      src={item.url_anh_ket_qua}
                      alt="Lịch sử ảnh kết quả"
                      sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                    <Box
                      sx={{
                        position: 'absolute',
                        inset: 'auto 0 0 0',
                        px: 1.5,
                        py: 1.2,
                        color: '#ffffff',
                        bgcolor: 'linear-gradient(180deg, rgba(15, 23, 42, 0) 0%, rgba(15, 23, 42, 0.78) 100%)'
                      }}
                    >
                      <Typography sx={{ fontWeight: 600, fontSize: '0.88rem', textShadow: '0 1px 6px rgba(0, 0, 0, 0.35)' }}>
                        {item.createdAt ? new Date(item.createdAt).toLocaleString('vi-VN') : 'Không rõ thời gian'}
                      </Typography>
                    </Box>
                    <IconButton
                      size="small"
                      onClick={(event) => {
                        event.stopPropagation()
                        handleDeleteHistoryItem(item._id)
                      }}
                      disabled={deletingHistoryId === item._id}
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        width: 32,
                        height: 32,
                        bgcolor: 'rgba(255, 255, 255, 0.92)',
                        color: '#b91c1c',
                        zIndex: 2,
                        boxShadow: '0 8px 18px rgba(15, 23, 42, 0.16)',
                        '&:hover': { bgcolor: '#fee2e2' }
                      }}
                    >
                      {deletingHistoryId === item._id ? <CircularProgress size={16} color="inherit" /> : <DeleteOutlineRoundedIcon fontSize="small" />}
                    </IconButton>
                  </Box>
                  <Stack spacing={1} sx={{ p: 1.3, flex: 1, minHeight: 0 }}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1} sx={{ flexShrink: 0 }}>
                      <Typography sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' }}>
                        Kết quả
                      </Typography>
                      <Chip
                        label={`${item.cac_benh_nhan_dien?.length || 0} phát hiện`}
                        size="small"
                        sx={{ height: 22, borderRadius: 999, fontWeight: 600, bgcolor: '#e0f2fe', color: '#075985' }}
                      />
                    </Stack>
                    <Box
                      sx={{
                        flex: 1,
                        minHeight: 0,
                        overflow: 'auto',
                        pr: 0.5,
                        '&::-webkit-scrollbar': { width: 6 },
                        '&::-webkit-scrollbar-thumb': {
                          bgcolor: 'rgba(100, 116, 139, 0.38)',
                          borderRadius: 999
                        }
                      }}
                    >
                      {renderDetections(item.cac_benh_nhan_dien, { compact: true })}
                    </Box>
                  </Stack>
                </Box>
              </Box>
            ))}
          </Box>
        </Paper>
      </Box>

      <Dialog
        open={isImageViewerOpen}
        onClose={handleCloseImageViewer}
        maxWidth={false}
        fullWidth
        PaperProps={{
          sx: {
            width: 'min(1200px, 96vw)',
            height: 'min(860px, 92vh)',
            m: 1.5,
            borderRadius: 2,
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle sx={{ px: 2, py: 1.5, borderBottom: '1px solid rgba(100, 116, 139, 0.18)' }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2}>
            <Typography sx={{ fontWeight: 700, color: '#0f172a' }}>
              Ảnh kết quả nhận diện
            </Typography>
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <IconButton
                onClick={() => changeImageZoom(-IMAGE_ZOOM_STEP)}
                disabled={imageZoom <= MIN_IMAGE_ZOOM}
                aria-label="Thu nhỏ ảnh"
              >
                <ZoomOutRoundedIcon />
              </IconButton>
              <Button
                size="small"
                onClick={() => setImageZoom(1)}
                sx={{ minWidth: 72, textTransform: 'none', fontWeight: 600 }}
              >
                {Math.round(imageZoom * 100)}%
              </Button>
              <IconButton
                onClick={() => changeImageZoom(IMAGE_ZOOM_STEP)}
                disabled={imageZoom >= MAX_IMAGE_ZOOM}
                aria-label="Phóng to ảnh"
              >
                <ZoomInRoundedIcon />
              </IconButton>
              <IconButton onClick={handleCloseImageViewer} aria-label="Đóng trình xem ảnh">
                <CloseRoundedIcon />
              </IconButton>
            </Stack>
          </Stack>
        </DialogTitle>
        <DialogContent
          onWheel={handleImageViewerWheel}
          sx={{
            p: 0,
            overflow: 'auto',
            bgcolor: '#0f172a'
          }}
        >
          <Box
            sx={{
              minWidth: '100%',
              minHeight: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              p: 2
            }}
          >
            <Box
              component="img"
              src={viewerImageUrl}
              alt="Ảnh kết quả nhận diện phóng to"
              sx={{
                width: `${imageZoom * 100}%`,
                height: 'auto',
                maxWidth: 'none',
                objectFit: 'contain',
                display: 'block',
                transition: 'width 0.15s ease'
              }}
            />
          </Box>
        </DialogContent>
      </Dialog>
    </Container>
  )
}

export default SkinDetection
