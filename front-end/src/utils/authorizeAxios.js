import axios from 'axios'
import { toast } from 'react-toastify'
import { interceptorLoadingElements } from './formatter'
import { refreshTokenAPI } from '~/apis'
import { clearCurrentUser } from '~/redux/user/userSlice'

/*
 * Không thể import { store } from '~/redux/store' theo cách thông thường ở đây
 * Giải pháp: Inject store - là một kỹ thuật khi cần sử dụng biến redux store ở các file ngoài phạm vi component
 * như file authorizeAxios hiện tại
 * Hiểu đơn giản: khi ứng dụng bắt đầu chạy lên, code sẽ chạy vào main.jsx đầu tiên, từ bên đó chúng ta gọi
 * hàm injectStore ngay lập tức để gán biến mainStore vào biến axiosReduxStore cục bộ trong file này.
 * https://redux.js.org/faq/code-structure#how-can-i-use-the-redux-store-in-non-component-files
 */
let axiosReduxStore
export const injectStore = mainStore => {
  axiosReduxStore = mainStore
}

//Khởi tạo 1 đối tượng Axios để custom và cấu hình chung cho dự án
let authorizedAxiosInstance = axios.create()

//Thời gian chờ tối đa của 1 request: 10 phút
authorizedAxiosInstance.defaults.timeout = 1000 * 60 * 10

//withCredentials: Sẽ cho phép axios tự động gửi cookie trong mỗi request lên BE (phục vụ việc lưu JWT tokens
//(refresh & access) vào trong httpOnly Cookie của trình duyệt)
authorizedAxiosInstance.defaults.withCredentials = true

// Cấu hình Interceptors (Bộ đánh chặn vào giữa mọi Request và Response)
// https://axios-http.com/docs/interceptors
// Interceptor Request: Can thiệp vào giữa những cái request API
authorizedAxiosInstance.interceptors.request.use((config) => {
  // Do something before request is sent
  //Kỹ thuật chặn spam click (xem ở formatter chứa function)
  interceptorLoadingElements(true)

  return config
}, (error) => {
  // Do something with request error
  return Promise.reject(error)
}
)

//Khởi tạo 1 promise cho việc gọi api refresh_token
//Mục đích tạo Promise này để khi nào gọi api refresh_token xong xuôi thì mới retry lại nhiều api bị lỗi trước đó
// https://www.thedutchlab.com/inzichten/using-axios-interceptors-for-refreshing-your-api-token
let refreshTokenPromise = null

// Interceptor Response: Can thiệp vào giữa những cái response API
authorizedAxiosInstance.interceptors.response.use((response) => {
  //Kỹ thuật chặn spam click (xem ở formatter chứa function)
  interceptorLoadingElements(false)

  return response
}, (error) => {
  // Any status codes that falls outside the range of 2xx cause this function to trigger
  // Do something with response error
  //Mọi status code ngoài 200 - 299 sẽ là error và sẽ rơi vào đây

  //Kỹ thuật chặn spam click (xem ở formatter chứa function)
  interceptorLoadingElements(false)

  // Quan trọng: Xử lý refreshToken tự động
  //Th1: Nếu như nhận mã 401 (UNAUTHORIZED) từ BE, thì gọi API đăng xuất
  if (error.response?.status === 401) {
    axiosReduxStore.dispatch(clearCurrentUser())
  }

  //Th2: Nếu như nhận mã 410 từ BE, thì sẽ gọi API refreshToken để làm mới accessToken
  //Đầu tiên lấy đc các request API đang bị lỗi thông qua error.config
  const originalRequests = error.config
  // console.log('originalRequests: ', originalRequests)
  if (error.response?.status === 410 && originalRequests) {
    originalRequests._retry = true

    //Kiểm tra nếu chưa có refreshTokenPromise thì thực hiện
    //việc gọi api refresh_token đồng thời gán vào cho cái refreshTokenPromise
    if (!refreshTokenPromise) {
      refreshTokenPromise = refreshTokenAPI()
        .then(data => {
          //Đồng thời accessToken đã nằm trong httpOnly Cookie (xử lý phía BE)
          return data?.accessToken
        })
        .catch((_error) => {
          //Nếu nhận bất kì lỗi nào từ api refresh token thì logout
          axiosReduxStore.dispatch(clearCurrentUser())
          return Promise.reject(_error)
        })
        .finally(() => {
          //Dù API có thành công hay lỗi thì vẫn gán refreshTokenPromise về null như ban đầu
          refreshTokenPromise = null
        })
    }
    //eslint-disable-next-line no-unused-vars
    return refreshTokenPromise.then(accessToken => {
      /**
       * Bước 1: Đối với Trường hợp nếu dự án cần lưu accessToken vào localStorage hoặc đâu đó thì sẽ viết
       * thêm code xử lý ở đây.
       * Hiện tại ở đây không cần bước 1 này vì chúng ta đã đưa accessToken vào cookie (xử lý từ phía BE)
       * sau khi api refreshToken được gọi thành công.
       */
      // Example: axios.defaults.headers.common['Authorization'] = 'Bearer' + accessToken

      // Bước 2: Bước Quan trọng: Return lại axios instance của chúng ta kết hợp các originalRequests để
      // gọi lại những api ban đầu bị lỗi
      return authorizedAxiosInstance(originalRequests)
    })
  }

  //Xử lý tập trung phần hiển thị thông báo lỗi trả về từ mọi API ở đây (Viết code 1 lần - clean code)
  //console.log error ra là sẽ thấy cấu trúc data dẫn tới message lỗi như dưới đây
  let errorMessage = error?.errorMessage

  if (error.response?.data?.message) {
    errorMessage = error.response?.data?.message
  }

  //Dùng toastify để hiển thị bất kể mọi mã lỗi lên màn hình, ngoại trừ mã 410 - GONE phục vụ việc tự động refresh lại token
  if (error.response?.status !== 410) {
    toast.error(errorMessage)
  }

  return Promise.reject(error)
})


export default authorizedAxiosInstance
