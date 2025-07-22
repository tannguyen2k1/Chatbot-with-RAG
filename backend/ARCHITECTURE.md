# LUỒNG XỬ LÝ REQUEST TRONG DỰ ÁN

## 1. CLIENT GỬI REQUEST

↓

## 2. FASTAPI ROUTER (api/)

- Nhận request từ client
- Validate input data với Pydantic schemas
  ↓

## 3. MIDDLEWARE/DEPENDENCIES

- Kiểm tra authentication (JWT token)
- Kiểm tra permissions (RBAC)
- Inject database session
  ↓

## 4. SERVICES (Business Logic)

- Xử lý logic nghiệp vụ
- Tương tác với database models
  ↓

## 5. DATABASE LAYER

- SQLAlchemy ORM
- PostgreSQL database
  ↓

## 6. RESPONSE

- Format data với Pydantic response schemas
- Trả về JSON cho client

# VÍ DỤ CỤ THỂ: TẠO ORDER MỚI

POST /orders/
├── api/orders.py:create_order() # 1. Endpoint handler
├── middleware/permissions.py # 2. Check quyền order_create
├── services/order.py:OrderService # 3. Business logic
├── database/models/orders.py:Order # 4. Database model
└── validators/orders.py:OrderResponse # 5. Response format
