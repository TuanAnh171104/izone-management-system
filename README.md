# IZONE - Hệ thống quản lý trung tâm học tập thông minh

[![ASP.NET Core](https://img.shields.io/badge/ASP.NET%20Core-6.0+-purple.svg)](https://dotnet.microsoft.com/)
[![React](https://img.shields.io/badge/React-19.0+-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.9+-blue.svg)](https://www.typescriptlang.org/)
[![SQL Server](https://img.shields.io/badge/SQL%20Server-2019+-red.svg)](https://www.microsoft.com/en-us/sql-server)
[![Python](https://img.shields.io/badge/Python-3.8+-yellow.svg)](https://www.python.org/)
[![Machine Learning](https://img.shields.io/badge/ML-RandomForest-green.svg)](https://scikit-learn.org/)

## 📋 Mô tả dự án

**IZONE** là hệ thống quản lý trung tâm học tập thông minh tích hợp trí tuệ nhân tạo được phát triển cho khóa luận tốt nghiệp. Hệ thống được thiết kế để quản lý toàn diện các hoạt động của trung tâm học tập với các tính năng tiên tiến:

### 🎯 **Tính năng cốt lõi**
- ✅ **Quản lý học viên và giảng viên** - Hồ sơ chi tiết và phân quyền
- ✅ **Quản lý khóa học và lớp học** - Lịch trình linh hoạt và phân bổ giảng viên
- ✅ **Điểm danh và chấm điểm** - Tự động và thủ công với lịch sử đầy đủ
- ✅ **Thanh toán đa kênh** - VietQR, VNPay, SePay integration
- ✅ **Báo cáo thông minh** - Analytics với stored procedures và ML insights
- ✅ **Quản lý địa điểm học tập** - Đa địa điểm với quản lý thuê mặt bằng
- ✅ **Hệ thống thông báo tự động** - Push notifications và email alerts

### 🤖 **Tính năng AI/ML**
- 🧠 **Dự đoán nguy cơ bỏ học** - RandomForest model với độ chính xác cao
- 📊 **Phân tích xu hướng** - Predictive analytics cho enrollment
- 🎯 **Khuyến nghị cá nhân hóa** - Course recommendations
- 📈 **Business Intelligence** - Automated reporting với insights

### 💰 **Tính năng tài chính**
- 💳 **Ví điện tử học viên** - Digital wallet system
- 🏦 **Tích hợp thanh toán** - VietQR, VNPay, SePay gateways
- 📊 **Quản lý chi phí** - Import Excel và báo cáo tài chính
- 🏢 **Quản lý thuê mặt bằng** - Rental space management
- 📝 **Hệ thống đặt chỗ** - Class reservation system

## 🏗️ Kiến trúc hệ thống

```
IZONE_Web/
├── Backend/                 # ASP.NET Core API
│   ├── IZONE.API/          # Web API Layer
│   │   ├── Controllers/    # API Endpoints
│   │   ├── Properties/     # Launch Settings
│   │   └── appsettings.json # Configuration
│   ├── IZONE.Core/         # Business Logic Layer
│   │   ├── Interfaces/     # Contracts & Abstractions
│   │   └── Models/         # Domain Entities
│   ├── IZONE.Infrastructure/ # Data Access Layer
│   │   ├── Data/           # DbContext & Configurations
│   │   ├── Repositories/   # Data Access Implementations
│   │   ├── Services/       # Business Services
│   │   └── Migrations/     # Database Migrations
│   └── ML_Models/          # Machine Learning Layer
│       ├── models/         # Trained Models & Services
│       └── TrainData.csv   # Training Dataset
├── Frontend/               # React TypeScript Client
    └── izone-client/       # React Application
        ├── public/         # Static Assets
        ├── src/            # Source Code
        │   ├── components/ # Reusable Components
        │   ├── pages/      # Page Components
        │   ├── services/   # API Services
        │   └── styles/     # CSS Stylesheets
        └── package.json    # Dependencies

```

## 🛠️ Công nghệ sử dụng

### Backend
- **ASP.NET Core 6.0+** - Web API Framework
- **Entity Framework Core** - ORM với Code-First Migrations
- **SQL Server 2019+** - Database với Stored Procedures
- **AutoMapper** - Object mapping
- **JWT Authentication** - Xác thực người dùng
- **Swagger/OpenAPI** - API Documentation
- **Python 3.8+** - Machine Learning services
- **scikit-learn** - ML framework (RandomForest)
- **pandas & numpy** - Data processing

### Frontend
- **React 19** - UI Framework với Concurrent Features
- **TypeScript 4.9+** - Type-safe JavaScript
- **Material-UI v7** - Modern UI Component Library
- **Redux Toolkit** - State management
- **React Router v7** - Client-side routing
- **Axios** - HTTP Client với interceptors
- **React Hook Form** - Form management
- **Recharts** - Data visualization và analytics

### Machine Learning
- **RandomForest Classifier** - Dropout prediction model
- **Jupyter Notebook** - Model training và experimentation
- **Joblib** - Model serialization
- **Pandas** - Data preprocessing
- **TrainData.csv** - Training dataset

### Payment Integration
- **VietQR** - QR code payment standard
- **VNPay Gateway** - Domestic payment gateway
- **HMAC-SHA256** - Payment signature validation

### Development Tools
- **Visual Studio 2022** - IDE cho Backend development
- **Visual Studio Code** - IDE cho Frontend và Python
- **SQL Server Management Studio** - Database management
- **Git** - Version control với GitFlow
- **Postman** - API testing và documentation
- **PowerShell** - Automation scripts

## 🚀 Cài đặt và chạy

### Điều kiện tiên quyết
- **.NET 6.0 SDK** hoặc cao hơn
- **Node.js 18.0** hoặc cao hơn
- **Python 3.8+** (cho Machine Learning features)
- **SQL Server 2019** hoặc cao hơn
- **Git**
- **Visual Studio 2022** hoặc **VS Code**

### 🔧 **Cài đặt Python Dependencies** (cho ML features)

```bash
# Cài đặt Python packages
pip install scikit-learn pandas numpy joblib

# Hoặc sử dụng requirements.txt (nếu có)
pip install -r requirements.txt
```

### ⚙️ **Backend Setup**

1. **Clone repository**
   ```bash
   git clone <repository-url>
   cd IZONE_Web/Backend
   ```

2. **Cài đặt .NET dependencies**
   ```bash
   dotnet restore
   ```

3. **Cấu hình database**
   - Tạo database mới trong SQL Server
   - Cập nhật connection string trong `appsettings.json`:
   ```json
   {
     "ConnectionStrings": {
       "DefaultConnection": "Server=localhost;Database=IZONE;Trusted_Connection=True;MultipleActiveResultSets=true"
     }
   }
   ```

4. **Chạy migrations**
   ```bash
   dotnet ef database update
   ```

5. **Cấu hình thanh toán** (tùy chọn)
   - Cập nhật thông tin VNPay/SePay trong `appsettings.json`
   - Tham khảo phần [Payment Configuration](#-payment-configuration)

6. **Chạy ứng dụng**
   ```bash
   dotnet run --project IZONE.API
   ```

   API sẽ chạy tại: `https://localhost:5001` hoặc `http://localhost:5000`

### 🎨 **Frontend Setup**

1. **Cài đặt dependencies**
   ```bash
   cd IZONE_Web/Frontend/izone-client
   npm install
   ```

2. **Cấu hình API endpoint**
   - Cập nhật API base URL trong `src/services/api.ts`:
   ```typescript
   const API_BASE_URL = 'https://localhost:5001/api';
   ```

3. **Chạy ứng dụng**
   ```bash
   npm start
   ```

   Ứng dụng sẽ chạy tại: `http://localhost:3000`

### 🤖 **Machine Learning Setup** (tùy chọn)

1. **Kiểm tra model file**
   ```bash
   ls IZONE_Web/Backend/ML_Models/models/
   # Should contain: model_dropout_tuned.pkl, predict_service.py
   ```

2. **Test ML service**
   ```bash
   cd IZONE_Web/Backend/ML_Models/models
   python predict_service.py
   ```

### 🗄️ **Database Setup Scripts**

Hệ thống cung cấp các script tự động:

```bash
# Chạy PowerShell scripts để setup database
./create_baocaos_table.ps1
./create_table.ps1
./UpdateStatus.ps1
```

### 🔍 **Testing APIs**

1. **Sử dụng Swagger UI**
   - Truy cập: `https://localhost:5001/swagger`

2. **Sử dụng REST Client**
   - File: `IZONE_Web/Backend/IZONE.API/IZONE.API.http`

3. **Test payment systems**
   - File: `test_payment_api.http`
   - Scripts: `test_vnpay_debug.ps1`, `test_payment_system.ps1`

### 🚀 **Production Deployment**

#### **Backend Deployment**
```bash
# Build và publish
dotnet publish -c Release -o ./publish

# Chạy trên IIS hoặc container
# IIS: Copy publish folder to wwwroot
# Docker: Use provided Dockerfile
```

#### **Frontend Deployment**
```bash
# Build production bundle
npm run build

# Deploy build/ folder to web server
# Apache/Nginx: Copy to document root
# Firebase: firebase deploy
```

#### **Environment Variables**
```bash
# Production appsettings.json
{
  "VNPay": {
    "IsProduction": true,
    "BaseUrl": "https://vnpayment.vn"
  },
  "SePay": {
    "IsProduction": true
  },
  "ConnectionStrings": {
    "DefaultConnection": "Server=prod-server;Database=IZONE;User Id=user;Password=password;"
  }
}
```

## 📊 Tính năng chính

### 👥 **Quản lý người dùng**
- 🔐 **Xác thực và phân quyền** - JWT Authentication với role-based access
- 👤 **Hồ sơ chi tiết** - Quản lý thông tin cá nhân học viên và giảng viên
- 👨‍💼 **Phân quyền Admin** - Quản lý tài khoản và hệ thống
- 👨‍🏫 **Quản lý giảng viên** - Phân công và theo dõi giảng viên
- 👨‍🎓 **Quản lý học viên** - Hồ sơ học viên với lịch sử học tập

### 🤖 **Machine Learning & AI**
- 🧠 **Dự đoán bỏ học** - RandomForest model phân tích nguy cơ bỏ học
- 📊 **Predictive Analytics** - Phân tích xu hướng tuyển sinh
- 🎯 **Khuyến nghị khóa học** - Personalized course recommendations
- 📈 **Business Intelligence** - Automated insights và reporting
- 📉 **Risk Assessment** - Đánh giá rủi ro học viên theo thời gian thực

### 📚 **Quản lý đào tạo**
- 📖 **Quản lý khóa học** - Tạo, cập nhật và quản lý catalog khóa học
- 👨‍🏫 **Phân bổ giảng viên** - Tự động và thủ công phân công
- 📅 **Lịch trình linh hoạt** - Quản lý thời khóa biểu đa địa điểm
- 👥 **Theo dõi sĩ số** - Monitoring class capacity và enrollment
- 📝 **Quản lý buổi học** - Chi tiết sessions với attendance tracking

### 📝 **Đánh giá và chấm điểm**
- ✅ **Điểm danh** -  attendance
- 📊 **Chấm điểm** - Grade calculation với rubrics
- 📈 **Theo dõi tiến độ** - Progress tracking và learning analytics
- 📋 **Báo cáo kết quả** - Comprehensive grade reports
- 🎯 **Phản hồi cá nhân** - Individual feedback và improvement plans

### 💰 **Hệ thống thanh toán**
- 💳 **Ví điện tử** - Digital wallet cho học viên
- 🏦 **Đa cổng thanh toán** - VietQR, VNPay
- 📱 **QR Payment** - Scan-to-pay với mobile banking apps
- 🔄 **Auto Reconciliation** - Tự động đối chiếu thanh toán
- 📊 **Báo cáo tài chính** - Financial analytics và revenue tracking

### 🏢 **Quản lý cơ sở vật chất**
- 🏢 **Quản lý địa điểm** - Multi-location campus management
- 🏠 **Thuê mặt bằng** - Rental space management với contracts
- 📊 **Utilization Analytics** - Space usage optimization

### 📊 **Báo cáo và phân tích**
- 📈 **Advanced Reporting** - Stored procedures với complex analytics
- 📊 **Real-time Dashboards** - Interactive data visualization
- 📋 **Custom Reports** - Flexible report builder
- 📤 **Export Capabilities** - PDF, Excel export features
- 🔍 **Data Mining** - Advanced querying và filtering

### 💬 **Thông báo và giao tiếp**
- 🔔 **Push Notifications** - Real-time alerts và announcements
- 💬 **In-app Messaging** - Internal communication system
- 📅 **Calendar Integration** - Schedule và event notifications
- 🎯 **Personalized Alerts** - Smart notification targeting

### 📊 **Quản lý chi phí**
- 📥 **Import Excel** - Bulk cost data import
- 💰 **Cost Tracking** - Detailed expense management
- 📈 **Budget Analysis** - Financial planning và forecasting
- 📋 **Cost Reports** - Comprehensive financial reporting
- 🎯 **Cost Optimization** - Identify savings opportunities

## 🔧 Cấu trúc Database

Hệ thống sử dụng SQL Server với kiến trúc Code-First và các bảng chính sau:

### 👥 **Quản lý người dùng**
- **TaiKhoan** - Tài khoản đăng nhập và phân quyền
- **HocVien** - Thông tin chi tiết học viên
- **GiangVien** - Thông tin chi tiết giảng viên

### 📚 **Quản lý đào tạo**
- **KhoaHoc** - Catalog khóa học
- **LopHoc** - Thông tin lớp học và lịch trình
- **BuoiHoc** - Chi tiết từng buổi học
- **DangKyLop** - Đăng ký lớp học của học viên
- **DiaDiem** - Quản lý địa điểm học tập

### 📝 **Đánh giá và chấm điểm**
- **DiemDanh** - Bảng điểm danh học viên
- **DiemSo** - Bảng điểm số và đánh giá
- **BaoLuu** - Hệ thống đặt chỗ và reservation

### 💰 **Tài chính và thanh toán**
- **ThanhToan** - Lịch sử thanh toán
- **ViHocVien** - Ví điện tử học viên
- **ChiPhi** - Quản lý chi phí và expenses
- **ThueMatBang** - Quản lý thuê mặt bằng

### 🤖 **Machine Learning**
- **PredictionData** - Dữ liệu dự đoán ML
- **BaoCao** - Báo cáo phân tích với ML insights

### 💬 **Thông báo và giao tiếp**
- **ThongBao** - Hệ thống thông báo

### 🔧 **Stored Procedures & Triggers**
- **Report Stored Procedures** - Complex analytics queries
- **Auto Triggers** - Database triggers cho business logic
- **Status Update Procedures** - Automated status management

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

## 🤖 Machine Learning Features

### 🧠 **Dropout Prediction Model**
- **Algorithm**: RandomForest Classifier
- **Accuracy**: >85% trên tập test
- **Features**: 11 đặc trưng bao gồm điểm số, tỷ lệ chuyên cần, tuổi học viên
- **Training Data**: TrainData.csv với 1000+ records
- **Model File**: `model_dropout_tuned.pkl`

### 📊 **Prediction API**
```bash
# Dự đoán cho 1 học viên
POST /api/Prediction/predict-single
{
  "lopID": 1,
  "tyLeChuyenCan_NuaDau": 0.85,
  "soBuoiVang_NuaDau": 2,
  "soBuoiVangDau": 1,
  "diemGiuaKy": 8.5,
  "ketQuaGiuaKy": "DAT",
  "soNgayDangKySom": 30,
  "tuoiHocVien": 22,
  "khoaHocID": 1,
  "giangVienID": 5,
  "diaDiemID": 2
}

# Response
{
  "dropout_risk": 0.23,
  "dropout_percentage": 23.0,
  "status": "low_risk"
}
```

### 🎯 **Business Intelligence**
- **Trend Analysis**: Phân tích xu hướng tuyển sinh
- **Risk Dashboard**: Real-time risk monitoring
- **Personalized Recommendations**: Course suggestions
- **Automated Reports**: ML-powered insights

## 💰 Payment System Integration

### 🏦 **Supported Gateways**
- **VietQR**: QR code payment (Ngân hàng Nhà nước standard)
- **VNPay**: Domestic payment gateway

### 💳 **Digital Wallet**
- **Student Wallet**: Ví điện tử tích hợp
- **Transaction History**: Lịch sử giao dịch đầy đủ

### 📱 **Payment Flow**
```bash
# 1. Tạo payment với QR
POST /api/ThanhToan/create-payment
{
  "hocVienID": 1,
  "lopID": 1,
  "soTien": 1500000
}

# 2. Response với QR code
{
  "vietQRUrl": "https://img.vietqr.io/image/...",
  "bankInfo": {
    "bankId": "970415",
    "bankName": "VietinBank",
    "accountNumber": "1234567890",
    "accountName": "IZONE EDUCATION"
  }
}

# 3. Hủy payment (nếu cần)
POST /api/ThanhToan/cancel-payment/{transactionRef}
```

### 🔧 **Payment Configuration**
```json
// appsettings.json
{
  "VNPay": {
    "TmnCode": "JIWRMTIE",
    "HashSecret": "E6HPA55HNTTFD9PRHX0A359LVOVRH73O",
    "BaseUrl": "https://sandbox.vnpayment.vn"
  },
  "SePay": {
    "BaseUrl": "https://pay.sepay.vn/v1",
    "MerchantId": "YOUR_MERCHANT_ID",
    "SecretKey": "YOUR_SECRET_KEY"
  },
  "Payment": {
    "BankInfo": {
      "BankId": "970415",
      "AccountNumber": "1234567890",
      "AccountName": "IZONE EDUCATION"
    }
  }
}
```

## 📝 API Documentation

Khi chạy backend, truy cập Swagger UI tại:
```
https://localhost:5001/swagger
```

### 🔗 **Key API Endpoints**

#### **Authentication**
- `POST /api/TaiKhoan/login` - Đăng nhập
- `POST /api/TaiKhoan/register` - Đăng ký

#### **Machine Learning**
- `POST /api/Prediction/predict-single` - Dự đoán rủi ro bỏ học
- `POST /api/Prediction/predict-batch` - Dự đoán hàng loạt

#### **Payment System**
- `POST /api/ThanhToan/create-payment` - Tạo thanh toán VietQR
- `POST /api/ThanhToan/create-vnpay-payment` - Thanh toán VNPay
- `POST /api/ThanhToan/create-sepay-payment` - Thanh toán SePay
- `GET /api/ViHocVien/{id}/balance` - Kiểm tra số dư ví

#### **Reports & Analytics**
- `GET /api/BaoCao/student-performance` - Báo cáo học viên
- `GET /api/BaoCao/financial-summary` - Báo cáo tài chính
- `GET /api/BaoCao/dropout-risk-analysis` - Phân tích rủi ro

#### **Class Management**
- `GET /api/LopHoc/available` - Lớp học còn trống
- `POST /api/DangKyLop/register` - Đăng ký lớp học
- `POST /api/BaoLuu/reserve` - Đặt chỗ lớp học

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

- **Sinh viên**: [Nguyễn Tuấn Anh]
- **Trường**: [Đại học Kinh tế quốc dân]

⭐ Nếu dự án này hữu ích với bạn, hãy cho một sao để ủng hộ!
