# BÁO CÁO TIẾN ĐỘ ĐỒ ÁN TỐT NGHIỆP LẦN 2

## Phần 1: Thông tin chung

| Mục | Chi tiết |
| --- | --- |
| Họ và tên sinh viên | Châu Hoàng Huy |
| Mã số sinh viên | 102210316 |
| Lớp | 21TCLC_KHDL2 |
| Giảng viên hướng dẫn | ThS Mai Văn Hà |
| Tên đề tài | Hệ thống nhận diện bệnh da liễu bằng hình ảnh, kết hợp Chatbot tư vấn |

## Phần 2: Tổng quan hệ thống đã thực hiện

### Tình trạng triển khai hiện tại

Ở giai đoạn báo cáo tiến độ lần 2, hệ thống đã hoàn thiện các nền tảng chính của ứng dụng web và tập trung triển khai hai chức năng trọng tâm của đề tài: nhận diện bệnh da liễu bằng hình ảnh và chatbot tư vấn da liễu. Các phần frontend, backend, xác thực người dùng, lưu trữ dữ liệu và tích hợp dịch vụ ngoài đã được tổ chức theo mô hình full-stack, tạo nền tảng để người dùng có thể đăng nhập, sử dụng chức năng nhận diện và nhận tư vấn ở mức tham khảo.

Phần frontend được xây dựng bằng React, Vite và Material UI. Bên cạnh các màn hình đăng nhập, đăng ký, xác thực tài khoản, thiết lập thông tin cá nhân và chat, hệ thống đã bổ sung màn hình nhận diện bệnh da liễu cho phép người dùng chọn ảnh, xem trước ảnh, gửi ảnh lên hệ thống và xem kết quả phân tích.

Phần backend sử dụng Node.js/Express, MongoDB, JWT, Cloudinary và mô hình controller-service-model. Backend hiện đã có luồng xử lý riêng cho nhận diện bệnh da, bao gồm upload ảnh gốc, gọi Python Server để suy luận bằng mô hình YOLO, nhận ảnh kết quả, lưu ảnh lên Cloudinary và ghi lịch sử nhận diện vào MongoDB theo từng người dùng.

Song song với chức năng nhận diện, hệ thống đã xây dựng Python Server bằng FastAPI để phục vụ hai nhiệm vụ chính: xử lý ảnh nhận diện bệnh da qua endpoint `/detect` và cung cấp chatbot tư vấn qua endpoint `/chat`. Việc tách Python Server giúp phần suy luận AI và xử lý RAG độc lập hơn với backend Node.js, thuận tiện cho việc mở rộng và tối ưu trong các giai đoạn tiếp theo.

### Dataset đã chuẩn bị

Dataset hình ảnh bệnh da đã được tổ chức trên Google Drive theo từng thư mục bệnh. Dữ liệu hiện gồm 8 nhóm bệnh với tổng cộng 899 ảnh, phục vụ cho quá trình tiền xử lý, huấn luyện, kiểm thử và đánh giá mô hình nhận diện bệnh da.

**Bảng 1. Thống kê số lượng ảnh dataset theo loại bệnh.**

| STT | Loại bệnh | Số lượng ảnh |
| --- | --- | ---: |
| 1 | Viêm da cơ địa | 112 |
| 2 | Mày đay | 223 |
| 3 | Vảy nến | 83 |
| 4 | Bệnh lý niêm mạc miệng | 96 |
| 5 | Zona thần kinh | 85 |
| 6 | Mụn cóc | 105 |
| 7 | Giang mai | 101 |
| 8 | Mụn trứng cá | 94 |
| - | Tổng cộng | 899 |

Dataset được sinh viên tự thu thập từ nhiều nguồn tham khảo công khai trên Internet, tiêu biểu như DermNet NZ và Atlas Dermatológico. Sau khi thu thập, dữ liệu được phân loại lại theo từng nhóm bệnh và tổ chức thành các thư mục riêng để thuận tiện cho quản lý, tiền xử lý và huấn luyện mô hình.

Do ảnh được tổng hợp từ nhiều nguồn khác nhau, dữ liệu vẫn có sự khác biệt về kích thước, ánh sáng, góc chụp, nền ảnh và mức độ rõ của vùng tổn thương. Đây là yếu tố cần tiếp tục xử lý để cải thiện chất lượng đầu vào. Ngoài ra, số lượng ảnh giữa các nhóm bệnh chưa hoàn toàn cân bằng, vì vậy ở giai đoạn tiếp theo cần tiếp tục làm sạch dữ liệu, loại bỏ ảnh trùng lặp hoặc kém chất lượng, chuẩn hóa kích thước, chia tập train/validation/test và áp dụng tăng cường dữ liệu cho các lớp có ít ảnh.

### Kết quả vận hành đạt được

Luồng xác thực tài khoản, đăng nhập, refresh token, phân vai người dùng và bảo vệ route đã được xây dựng ổn định. Người dùng sau khi đăng nhập có thể sử dụng các chức năng chính của hệ thống, trong đó phần báo cáo lần 2 tập trung vào nhận diện bệnh da liễu và chatbot tư vấn.

Tính năng nhận diện bệnh da liễu đã hoàn thành luồng chính từ giao diện đến backend và Python Server. Người dùng có thể tải ảnh JPG/JPEG/PNG, xem trước ảnh trên giao diện, gửi ảnh để hệ thống phân tích và nhận lại kết quả gồm ảnh đã đánh dấu vùng nhận diện cùng danh sách bệnh dự đoán kèm độ chính xác tương ứng.

Tính năng chatbot tư vấn da liễu đã được xây dựng theo hướng RAG. Chatbot có thể nhận câu hỏi tiếng Việt, truy xuất ngữ cảnh liên quan từ dữ liệu tri thức da liễu, sau đó sinh câu trả lời ở mức tham khảo. Nội dung trả lời được định hướng an toàn, không chẩn đoán chắc chắn, không kê đơn và khuyến nghị người dùng đi khám khi có dấu hiệu nguy hiểm hoặc tình trạng cần bác sĩ đánh giá trực tiếp.

## Phần 3: Hai tính năng trọng tâm đã hoàn thành

### Tính năng 1: Nhận diện bệnh da liễu bằng hình ảnh

Chức năng nhận diện bệnh da liễu được xây dựng nhằm hỗ trợ người dùng gửi ảnh vùng da cần kiểm tra và nhận kết quả phân tích ban đầu từ mô hình AI. Trên giao diện, người dùng có thể chọn hoặc kéo thả ảnh, xem trước ảnh tại chỗ và chỉ gửi ảnh lên server khi bấm nút nhận diện. Cách triển khai này giúp người dùng kiểm soát ảnh đầu vào trước khi hệ thống xử lý.

Khi người dùng gửi ảnh, frontend tạo FormData và gọi API `/v1/skin-detections` ở backend. Backend kiểm tra quyền truy cập bằng middleware xác thực, upload ảnh gốc lên Cloudinary, sau đó gửi URL ảnh đến Python Server qua endpoint `/detect`. Python Server tải ảnh từ URL, dùng YOLO để suy luận, tạo danh sách bệnh nhận diện với độ chính xác và sinh ảnh kết quả có đánh dấu vùng phát hiện.

Sau khi Python Server trả kết quả, backend tiếp tục upload ảnh kết quả lên Cloudinary và lưu lịch sử nhận diện vào MongoDB. Mỗi bản ghi lịch sử gồm người dùng, URL ảnh gốc, URL ảnh kết quả, danh sách bệnh nhận diện, độ chính xác và thời gian tạo. Người dùng có thể xem lại lịch sử nhận diện và xóa từng bản ghi khi cần.

Tính năng này đã hoàn thành được luồng vận hành chính và có thể phục vụ demo chức năng nhận diện. Tuy nhiên, mô hình vẫn cần được tiếp tục cải thiện độ chính xác bằng cách làm sạch dataset, cân bằng dữ liệu giữa các lớp bệnh, tăng cường dữ liệu, đánh giá bằng các chỉ số như accuracy, precision, recall, confusion matrix và thử nghiệm thêm với ảnh thực tế ngoài tập dữ liệu ban đầu.

### Tính năng 2: Chatbot tư vấn da liễu

Chức năng chatbot được xây dựng nhằm hỗ trợ người dùng đặt câu hỏi liên quan đến bệnh da liễu và nhận phản hồi tham khảo dựa trên dữ liệu tri thức đã chuẩn bị. Thay vì chỉ trả lời theo mô hình ngôn ngữ tổng quát, chatbot sử dụng kiến trúc RAG để truy xuất thông tin liên quan trước khi sinh câu trả lời, giúp nội dung bám sát phạm vi đề tài hơn. Ở giai đoạn hiện tại, phần chatbot mới hoàn thành dữ liệu và luồng tư vấn cho 4/8 nhóm bệnh trong phạm vi dataset.

Bốn nhóm bệnh đã hoàn thành gồm: viêm da cơ địa, mày đay, vảy nến và mụn trứng cá. Dữ liệu tri thức của các bệnh này được chia thành các đoạn thông tin nhỏ, có metadata như bệnh, nhóm triệu chứng, vị trí tổn thương, mức ưu tiên truy xuất, mức độ cần bác sĩ và các thẻ cảnh báo an toàn. Hệ thống sử dụng sentence-transformers với mô hình multilingual-e5-base để tạo embedding và lưu chỉ mục trong ChromaDB. Khi người dùng gửi câu hỏi, chatbot thực hiện truy xuất ngữ nghĩa kết hợp với điểm metadata để chọn các đoạn thông tin phù hợp nhất.

Sau bước truy xuất, hệ thống dùng Gemini thông qua Google AI Studio để sinh câu trả lời cuối cùng bằng tiếng Việt. Chatbot hỗ trợ chế độ patient và doctor, trong đó chế độ patient được kiểm soát chặt hơn để tránh đưa ra nội dung quá chuyên môn, liều thuốc hoặc hướng dẫn điều trị không phù hợp. Nếu câu hỏi có dấu hiệu nguy hiểm hoặc liên quan đến điều trị cần chuyên môn, chatbot sẽ khuyến nghị người dùng đi khám bác sĩ.

Tính năng chatbot hiện đã có nền tảng xử lý chính gồm dữ liệu RAG, ChromaDB, embedding, truy xuất theo ngữ cảnh, sinh câu trả lời và API `/chat` trên Python Server. Tuy nhiên, phạm vi tri thức hiện mới bao phủ 4/8 bệnh, vì vậy giai đoạn tiếp theo cần tiếp tục hoàn thiện dữ liệu cho 4 nhóm bệnh còn lại, mở rộng kịch bản hỏi đáp, điều chỉnh prompt an toàn và đánh giá chất lượng câu trả lời để chatbot ổn định hơn khi tích hợp vào trải nghiệm người dùng cuối.

## Phần 4: Công nghệ sử dụng

### Giao diện và truy cập

React và Vite được sử dụng để xây dựng giao diện web. Material UI, Emotion và styled-components hỗ trợ thiết kế component, layout responsive và các màn hình chính như trang giới thiệu, đăng nhập, đăng ký, thiết lập tài khoản, chat và nhận diện bệnh da liễu.

Redux Toolkit, React Redux và Redux Persist được dùng để quản lý trạng thái người dùng và duy trì phiên làm việc trên frontend. React Router DOM đảm nhiệm điều hướng public route, protected route và các màn hình xác thực.

### Backend và lưu trữ dữ liệu

Backend sử dụng Express.js, MongoDB, Joi và mô hình controller-service-model để tách biệt xử lý request, nghiệp vụ và truy cập dữ liệu. Hệ thống xác thực dùng bcryptjs, jsonwebtoken, HTTP-only cookies, cookie-parser và middleware kiểm tra quyền truy cập.

Cloudinary, multer và streamifier được dùng để upload và lưu trữ ảnh, bao gồm ảnh đại diện, ảnh gốc phục vụ nhận diện và ảnh kết quả sau khi mô hình xử lý. MongoDB lưu thông tin người dùng, hội thoại, tin nhắn và lịch sử nhận diện bệnh da.

### AI nhận diện hình ảnh

Python Server được xây dựng bằng FastAPI và Uvicorn. Mô hình nhận diện sử dụng YOLO thông qua thư viện Ultralytics, kết hợp OpenCV và NumPy để đọc ảnh, xử lý ảnh, suy luận và xuất ảnh kết quả dạng JPEG. Endpoint `/detect` nhận URL ảnh, kiểm tra hợp lệ, tải ảnh, chạy mô hình và trả về ảnh kết quả cùng metadata nhận diện.

### Chatbot tư vấn

Chatbot sử dụng hướng tiếp cận Retrieval-Augmented Generation. Dữ liệu tri thức được lưu trong file JSON theo dạng các chunk, embedding được tạo bằng sentence-transformers với mô hình multilingual-e5-base và chỉ mục được lưu bằng ChromaDB. Gemini/Google AI Studio được dùng để sinh câu trả lời cuối cùng dựa trên ngữ cảnh đã truy xuất.

## Phần 5: Các chức năng backend/frontend

### Dịch vụ backend đang vận hành

Các nhóm chức năng backend hiện gồm xác thực và phiên đăng nhập, quản lý người dùng, phân vai doctor/patient, hội thoại, tin nhắn realtime, upload media, nhận diện bệnh da và chatbot tư vấn. Trong báo cáo lần 2, hai nhóm chức năng mới được nhấn mạnh là skin detections và Python AI Server.

Nhóm API nhận diện bệnh da đã có các chức năng tạo lượt nhận diện mới, lấy lịch sử nhận diện và xóa lịch sử theo người dùng. API được bảo vệ bằng middleware xác thực, sử dụng multer để nhận ảnh, Cloudinary để lưu ảnh và MongoDB để lưu metadata kết quả.

Python AI Server cung cấp endpoint `/health` để kiểm tra trạng thái, `/detect` để nhận diện bệnh da từ ảnh và `/chat` để trả lời câu hỏi bằng chatbot RAG. Việc tách riêng Python Server giúp hệ thống dễ quản lý phần AI, đồng thời backend Node.js vẫn giữ vai trò điều phối nghiệp vụ và bảo vệ tài nguyên người dùng.

### Chức năng frontend

Frontend đã có màn hình nhận diện bệnh da liễu với khu vực chọn ảnh, kéo thả ảnh, preview ảnh, nút nhận diện, hiển thị kết quả bệnh dự đoán bằng phần trăm độ chính xác và danh sách lịch sử nhận diện. Giao diện cũng hỗ trợ trạng thái loading, thông báo lỗi và thao tác xóa lịch sử.

Các màn hình xác thực, thiết lập tài khoản và chat realtime tiếp tục đóng vai trò nền tảng cho hệ thống. Phần chatbot tư vấn có thể tiếp tục được tích hợp vào giao diện người dùng để hỗ trợ giải thích kết quả nhận diện và trả lời câu hỏi thường gặp liên quan đến bệnh da liễu.

## Phần 6: Giám sát và quy trình triển khai

### Trạng thái giám sát

Hệ thống đã có endpoint kiểm tra trạng thái ở backend và Python Server. Backend có middleware xử lý lỗi tập trung để chuẩn hóa phản hồi API, còn Python Server có endpoint `/health` và `/rag/health` để kiểm tra trạng thái tải mô hình YOLO, dữ liệu RAG, chỉ mục ChromaDB và cấu hình Google API key.

Các chỉ số cần theo dõi trong giai đoạn tiếp theo gồm tỷ lệ lỗi upload ảnh, thời gian phản hồi API nhận diện, số lượt nhận diện thành công/thất bại, số lượng câu hỏi chatbot, tỷ lệ câu trả lời không tìm thấy ngữ cảnh, trạng thái kết nối MongoDB, dung lượng Cloudinary và mức ổn định của Python Server.

### Quy trình triển khai

Backend được chạy trong thư mục back-end bằng Node.js với các script phát triển và production. Frontend được chạy trong thư mục front-end bằng Vite. Python Server được chạy bằng Uvicorn từ thư mục python-server, cần đảm bảo đã cài các thư viện FastAPI, Ultralytics, OpenCV, ChromaDB, sentence-transformers, google-genai và python-dotenv.

Khi triển khai production, hệ thống cần cấu hình đầy đủ biến môi trường cho MongoDB, JWT, domain frontend, Cloudinary, Brevo, Python Server URL và Google API key. Đồng thời cần cấu hình HTTPS, CORS, cookie secure/sameSite, backup dữ liệu và cơ chế giám sát lỗi cho cả backend Node.js lẫn Python Server.

## Phần 7: Các nhiệm vụ tiếp theo

Kế hoạch tiếp theo không còn tập trung vào việc chuẩn bị nền tảng nhận diện và chatbot, vì hai chức năng này đã có luồng vận hành chính. Trọng tâm tiếp theo là cải thiện chất lượng mô hình, kiểm thử chatbot, hoàn thiện tích hợp trải nghiệm người dùng và chuẩn bị demo/triển khai.

| Nhiệm vụ | Kết quả kỳ vọng |
| --- | --- |
| Cải thiện độ chính xác mô hình nhận diện | Làm sạch dataset, cân bằng dữ liệu, tăng cường dữ liệu và đánh giá model bằng accuracy, precision, recall, confusion matrix. |
| Kiểm thử chức năng nhận diện | Thử nghiệm với ảnh thực tế, ảnh ngoài dataset, ảnh chất lượng thấp và các trường hợp không phát hiện bệnh để đánh giá độ ổn định. |
| Hoàn thiện chatbot tư vấn | Mở rộng dữ liệu tri thức, kiểm thử nhiều kịch bản hỏi đáp, điều chỉnh prompt an toàn và giảm khả năng trả lời ngoài phạm vi. |
| Tích hợp trải nghiệm nhận diện và chatbot | Cho phép chatbot hỗ trợ giải thích kết quả nhận diện ở mức tham khảo, đồng thời vẫn giữ cảnh báo không thay thế tư vấn bác sĩ. |
| Chuẩn bị demo và triển khai thử | Hoàn thiện cấu hình môi trường, health check, logging, tài liệu chạy hệ thống và quy trình demo các chức năng chính. |

## Kết luận

Báo cáo tiến độ lần 2 cho thấy hệ thống nhận diện bệnh da liễu bằng hình ảnh, kết hợp chatbot tư vấn đã hoàn thành hai chức năng trọng tâm của đề tài. Chức năng nhận diện đã có luồng đầy đủ từ giao diện upload ảnh, backend xử lý nghiệp vụ, Python Server chạy YOLO, lưu ảnh kết quả và lưu lịch sử nhận diện. Chức năng chatbot đã có nền tảng RAG với dữ liệu tri thức da liễu, embedding, ChromaDB và Gemini để sinh câu trả lời tiếng Việt theo ngữ cảnh.

Các thành phần frontend, backend và Python Server đã được tách lớp rõ ràng, có khả năng mở rộng và tiếp tục tối ưu. Trong giai đoạn tiếp theo, hệ thống cần tập trung cải thiện độ chính xác của mô hình nhận diện, kiểm thử chất lượng chatbot, mở rộng dữ liệu và chuẩn bị môi trường demo/triển khai thử nghiệm.
