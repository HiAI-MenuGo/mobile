import { MenuItem, NotificationItem, UserProfile } from '../types';

export const mockCategories = [
  'Tất cả',
  'Cà phê',
  'Trà trái cây',
  'Trà sữa',
  'Bánh & Snack',
  'Món chính',
];

const defaultDrinkModifiers = [
  {
    id: 'g_sugar',
    name: 'Đường',
    options: [
      { id: 's100', name: '100%' },
      { id: 's70', name: '70%' },
      { id: 's50', name: '50%' },
      { id: 's30', name: '30%' },
      { id: 's0', name: '0%' },
    ],
  },
  {
    id: 'g_ice',
    name: 'Đá',
    options: [
      { id: 'i100', name: '100%' },
      { id: 'i70', name: '70%' },
      { id: 'i50', name: '50%' },
      { id: 'i0', name: 'Không đá' },
    ],
  },
  {
    id: 'g_size',
    name: 'Kích cỡ',
    options: [
      { id: 'sz_m', name: 'Vừa (M)', extraPrice: 0 },
      { id: 'sz_l', name: 'Lớn (L)', extraPrice: 6000 },
    ],
  },
];

export const mockMenuItems: MenuItem[] = [
  {
    id: 'm1',
    name: 'Cà Phê Muối Hoàng Gia',
    category: 'Cà phê',
    price: 39000,
    imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=300&q=80',
    isPopular: true,
    description: 'Vị cà phê đậm đà quyện cùng lớp kem béo ngậy mằn mặn',
    modifierGroups: defaultDrinkModifiers,
    prepTimeMinutes: 7,
  },
  {
    id: 'm2',
    name: 'Bạc Xỉu Sữa Dừa Sấy',
    category: 'Cà phê',
    price: 42000,
    imageUrl: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=300&q=80',
    description: 'Cà phê sữa thơm béo ngọt ngào cùng dừa sấy giòn rụm',
    modifierGroups: defaultDrinkModifiers,
    prepTimeMinutes: 5,
  },
  {
    id: 'm3',
    name: 'Trà Đào Cam Sả Tươi',
    category: 'Trà trái cây',
    price: 45000,
    imageUrl: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=300&q=80',
    isPopular: true,
    description: 'Thanh mát giải nhiệt với miếng đào giòn ngọt và hương sả tự nhiên',
    modifierGroups: defaultDrinkModifiers,
    prepTimeMinutes: 6,
  },
  {
    id: 'm4',
    name: 'Trà Mãng Cầu Đắk Lắk',
    category: 'Trà trái cây',
    price: 48000,
    imageUrl: 'https://images.unsplash.com/photo-1595981267035-7b04ca84a82d?w=300&q=80',
    description: 'Vị chua ngọt bùng nổ vị giác kết hợp cùng thịt mãng cầu tươi',
    modifierGroups: defaultDrinkModifiers,
    prepTimeMinutes: 8,
  },
  {
    id: 'm5',
    name: 'Trà Sữa Ô Long Nướng Trân Châu',
    category: 'Trà sữa',
    price: 52000,
    imageUrl: 'https://images.unsplash.com/photo-1558857563-b37d1e89f816?w=300&q=80',
    isPopular: true,
    description: 'Trà ô long ủ nhiệt thơm khói béo ngậy kèm trân châu hoàng kim dai giòn',
    modifierGroups: [
      ...defaultDrinkModifiers,
      {
        id: 'g_topping',
        name: 'Topping thêm',
        options: [
          { id: 'top_tc', name: 'Trân châu hoàng kim', extraPrice: 5000 },
          { id: 'top_kc', name: 'Kem Cheese béo ngậy', extraPrice: 10000 },
          { id: 'top_td', name: 'Thạch dừa giòn', extraPrice: 5000 },
        ],
      },
    ],
    prepTimeMinutes: 10,
  },
  {
    id: 'm6',
    name: 'Croissant Phô Mai Trứng Muối',
    category: 'Bánh & Snack',
    price: 35000,
    imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=300&q=80',
    description: 'Bánh sừng bò ngàn lớp thơm lừng bơ Pháp và sốt trứng muối béo mịn',
    prepTimeMinutes: 12,
  },
  {
    id: 'm7',
    name: 'Bánh Tiramisu Ý Cổ Điển',
    category: 'Bánh & Snack',
    price: 49000,
    imageUrl: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=300&q=80',
    description: 'Lớp kem mascarpone mềm tan quyện hương rượu vang và cà phê espresso',
    prepTimeMinutes: 8,
  },
  {
    id: 'm8',
    name: 'Bánh Mì Chảo Bò Bít Tết',
    category: 'Món chính',
    price: 65000,
    imageUrl: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=300&q=80',
    description: 'Thịt bò mềm mọng sốt tiêu đen, trứng ốp la lòng đào và xúc xích Đức',
    prepTimeMinutes: 15,
  },
];



export const mockNotifications: NotificationItem[] = [
  {
    id: 'n1',
    title: 'Đơn hàng mới từ QR Bàn 03',
    message: 'Khách vừa gọi 2 Cà phê muối, 1 Trà đào cam sả. Chờ duyệt gửi bếp.',
    time: '2 phút trước',
    type: 'ORDER',
    isRead: false,
  },
  {
    id: 'n2',
    title: 'Thanh toán VietQR thành công',
    message: 'Nhận thành công 145.000đ cho hoá đơn HD-8842 từ khách Bàn 03.',
    time: '8 phút trước',
    type: 'PAYMENT',
    isRead: false,
  },
  {
    id: 'n3',
    title: 'Khách yêu cầu gọi nhân viên',
    message: 'Bàn 01 cần phục vụ thêm đá và nước lọc.',
    time: '25 phút trước',
    type: 'TABLE',
    isRead: true,
  },
  {
    id: 'n4',
    title: 'Cảnh báo tồn kho nguyên liệu',
    message: 'Sữa đặc Ngôi Sao Phương Nam chỉ còn 2 hộp dưới ngưỡng an toàn.',
    time: '1 giờ trước',
    type: 'SYSTEM',
    isRead: true,
  },
];

export const mockUserProfile: UserProfile = {
  name: 'Trần Tuấn',
  role: 'Quản Lý & Thu Ngân',
  code: 'NV-2026',
  phone: '0987 654 321',
  email: 'trantuan@menu-go.vn',
  branch: 'Chi nhánh 01 - Quận 1 (TP.HCM)',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80',
  shift: 'Ca Sáng (07:00 - 15:30)',
  dob: '15/08/1995',
};
