# VTMS Mobile App

React Native mobile application cho hệ thống VTMS sử dụng Expo và TypeScript.

## 🚀 Đã cấu hình

### ✅ Hoàn thành

1. **Cấu trúc dự án** - React Native với Ignite boilerplate
2. **Navigation** - React Navigation đã setup sẵn
3. **API Configuration** - Kết nối với backend FastAPI
4. **Authentication** - Login/Logout flow với VTMS backend
5. **State Management** - MobX-State-Tree stores

### 📋 Thư mục chính

```
mobile/app/
├── api/              # API client services
│   ├── api.ts        # Base API class
│   └── auth.api.ts   # Authentication API
├── config/           # Configuration files
│   ├── config.dev.ts  # Dev environment
│   └── config.prod.ts # Production environment
├── models/           # MobX-State-Tree stores
│   └── AuthenticationStore.ts
├── screens/          # App screens
│   └── LoginScreen.tsx
└── services/         # Business logic services
```

## 🔧 Cấu hình

### Environment Configuration

**Development** (`app/config/config.dev.ts {app/config/config.prod.ts`):

```typescript
export default {
  API_URL: "http://localhost:8000", // Backend URL
}
```

### Backend API

Mobile app đã được cấu hình để kết nối với backend FastAPI tại:

- **Development**: `http://localhost:8000`
- **Production**: Cần update trong `config.prod.ts`

## 🏃 Chạy ứng dụng

### Cài đặt dependencies

```bash
cd mobile
npm install
```

### Chạy trên Android/iOS Simulator

```bash
# iOS
npm run ios

# Android  
npm run android

# Start development server
npm start
```

### Build production

```bash
# iOS
npm run build:ios:prod

# Android
npm run build:android:prod
```

## 🔐 Authentication

### Login Flow

1. User nhập:
   - **Username**
   - **Password**
   - **Tenant Code** (mặc định: "default")

2. App gửi request đến `/api/auth/login`

3. Backend trả về:
   - `access_token` - JWT token
   - `user` - Thông tin user

4. App lưu token và redirect đến Dashboard

### Default Credentials

```
Username: root
Password: root123456
Tenant Code: default
```

## 📱 API Services

### AuthApi

```typescript
import { authApi } from "@/services/api"

// Login
const response = await authApi.login({
  username: "root",
  password: "root123456",
  tenant_code: "default"
})

// Logout
await authApi.logout()

// Get user info
const user = await authApi.getMe(token)
```

## 🎨 UI Components

App sử dụng các components có sẵn từ Ignite:

- `Screen` - Container cho screens
- `TextField` - Input fields
- `Button` - Buttons
- `Text` - Text display
- `Header` - Screen headers

## 📝 Các bước tiếp theo

### Đang pending:

1. **Dashboard Screen** - Tạo dashboard chính
2. **User Management** - CRUD user screens
3. **Tenant Management** - Quản lý tenants
4. **RBAC Integration** - Hiển thị permissions
5. **UI Enhancement** - Cải thiện giao diện

### Cách thêm màn hình mới:

1. Tạo screen trong `app/screens/`
2. Thêm route vào `app/navigators/AppNavigator.tsx`
3. Tạo API service nếu cần (trong `app/services/api/`)

## 🔗 Liên kết

- **Backend Docs**: See `/backend/README.md`
- **Architecture**: See `/backend/ARCHITECTURE.md`
- **Frontend**: See `/frontend/README.md`

## 🐛 Debug

### Xem logs

```bash
# iOS
npx react-native log-ios

# Android
npx react-native log-android
```

### React Native Debugger

```bash
npm install -g react-devtools
react-devtools
```

## 📦 Dependencies chính

- **React Native**: 0.76.9
- **Expo**: ^52.0.44
- **React Navigation**: ^7.0.14
- **MobX-State-Tree**: 5.3.0
- **Apisauce**: 3.0.1
- **TypeScript**: ~5.3.3

## 🆘 Troubleshooting

### Lỗi kết nối API

- Kiểm tra backend có đang chạy không
- Update `API_URL` trong config
- Android cần thêm `adb reverse` cho localhost

```bash
npm run adb
```

### Build errors

```bash
# Clean build
npm run prebuild:clean

# Reinstall dependencies
rm -rf node_modules
npm install
```

## 📄 License

See main project README.
