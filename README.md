# IZONE - Hệ thống quản lý trung tâm học tập

[![ASP.NET Core](https://img.shields.io/badge/ASP.NET%20Core-6.0+-purple.svg)](https://dotnet.microsoft.com/)
[![React](https://img.shields.io/badge/React-18.0+-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.9+-blue.svg)](https://www.typescriptlang.org/)
[![SQL Server](https://img.shields.io/badge/SQL%20Server-2019+-red.svg)](https://www.microsoft.com/en-us/sql-server)

## 📋 Mô tả dự án

**IZONE** là hệ thống quản lý trung tâm học tập toàn diện được phát triển cho khóa luận tốt nghiệp. Hệ thống được thiết kế để quản lý hiệu quả các hoạt động của trung tâm học tập bao gồm:

- ✅ Quản lý học viên và giảng viên
- ✅ Quản lý khóa học và lớp học
- ✅ Điểm danh và chấm điểm
- ✅ Thanh toán và thu phí
- ✅ Báo cáo và thống kê
- ✅ Quản lý địa điểm học tập
- ✅ Hệ thống thông báo

## 🏗️ Kiến trúc hệ thống

```
IZONE_Web/
├── Backend/                 # ASP.NET Core API
│   ├── IZONE.API/          # Web API Layer
│   ├── IZONE.Core/         # Business Logic Layer
│   └── IZONE.Infrastructure/ # Data Access Layer
└── Frontend/               # React TypeScript Client
    └── izone-client/       # React Application
```

## 🛠️ Công nghệ sử dụng

### Backend
- **ASP.NET Core 6.0+** - Web API Framework
- **Entity Framework Core** - ORM
- **SQL Server** - Database
- **AutoMapper** - Object mapping
- **JWT Authentication** - Xác thực người dùng
- **Swagger/OpenAPI** - API Documentation

### Frontend
- **React 18** - UI Framework
- **TypeScript** - Type-safe JavaScript
- **Material-UI** - UI Component Library
- **React Router** - Client-side routing
- **Axios** - HTTP Client
- **React Hook Form** - Form management

### Development Tools
- **Visual Studio 2022** - IDE cho Backend
- **Visual Studio Code** - IDE cho Frontend
- **SQL Server Management Studio** - Database management
- **Git** - Version control
- **Postman** - API testing

## 🚀 Cài đặt và chạy

### Điều kiện tiên quyết
- **.NET 6.0 SDK** hoặc cao hơn
- **Node.js 16.0** hoặc cao hơn
- **SQL Server 2019** hoặc cao hơn
- **Git**

### Backend Setup

1. **Clone repository**
   ```bash
   git clone <repository-url>
   cd IZONE_Web/Backend
   ```

2. **Cài đặt dependencies**
   ```bash
   dotnet restore
   ```

3. **Cấu hình database**
   - Tạo database mới trong SQL Server
   - Cập nhật connection string trong `appsettings.json`
   - Chạy migrations:
   ```bash
   dotnet ef database update
   ```

4. **Chạy ứng dụng**
   ```bash
   dotnet run --project IZONE.API
   ```

   API sẽ chạy tại: `https://localhost:5001` hoặc `http://localhost:5000`

### Frontend Setup

1. **Cài đặt dependencies**
   ```bash
   cd IZONE_Web/Frontend/izone-client
   npm install
   ```

2. **Cấu hình API endpoint**
   - Cập nhật API base URL trong `src/services/api.ts`

3. **Chạy ứng dụng**
   ```bash
   npm start
   ```

   Ứng dụng sẽ chạy tại: `http://localhost:3000`

## 📊 Tính năng chính

### 👥 Quản lý người dùng
- Đăng ký và đăng nhập tài khoản
- Phân quyền (Admin, Giáo viên, Học viên)
- Quản lý thông tin cá nhân

### 📚 Quản lý khóa học
- Tạo và quản lý khóa học
- Phân bổ giảng viên
- Đăng ký khóa học

### 👨‍🏫 Quản lý lớp học
- Tạo lớp học từ khóa học
- Phân công lịch học
- Theo dõi sĩ số

### 📝 Điểm danh và chấm điểm
- Điểm danh học viên
- Nhập điểm và đánh giá
- Báo cáo kết quả học tập

### 💰 Thanh toán
- Quản lý học phí
- Theo dõi thanh toán
- Báo cáo tài chính

### 📈 Báo cáo và thống kê
- Báo cáo học viên
- Thống kê doanh thu
- Báo cáo tiến độ học tập

## 🔧 Cấu trúc Database

Hệ thống sử dụng các bảng chính sau:

- **HocVien** - Thông tin học viên
- **GiangVien** - Thông tin giảng viên
- **KhoaHoc** - Thông tin khóa học
- **LopHoc** - Thông tin lớp học
- **DiemDanh** - Bảng điểm danh
- **DiemSo** - Bảng điểm số
- **ThanhToan** - Bảng thanh toán
- **BaoCao** - Bảng báo cáo

## 🔐 Bảo mật

- **JWT Authentication** cho API
- **Role-based Authorization**
- **Password Hashing** với bcrypt
- **CORS** được cấu hình phù hợp

## 🚀 Deployment

### Backend Deployment
```bash
dotnet publish -c Release
# Deploy thư mục publish ra server IIS hoặc Azure
```

### Frontend Deployment
```bash
npm run build
# Deploy thư mục build ra server web
```

## 📝 API Documentation

Khi chạy backend, truy cập Swagger UI tại:
```
https://localhost:5001/swagger
```

## 🤝 Đóng góp

Đây là dự án khóa luận cá nhân. Để đóng góp:

1. Fork dự án
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push lên branch (`git push origin feature/AmazingFeature`)
5. Tạo Pull Request

## 📄 Giấy phép

Dự án này được phát triển cho mục đích học tập và khóa luận tốt nghiệp.

## 👨‍💻 Tác giả

- **Sinh viên**: [Tên của bạn]
- **Giảng viên hướng dẫn**: [Tên giảng viên]
- **Trường**: [Tên trường đại học]

## 📞 Liên hệ

- **Email**: [email của bạn]
- **GitHub**: [GitHub profile của bạn]

---

⭐ Nếu dự án này hữu ích với bạn, hãy cho một sao để ủng hộ!
