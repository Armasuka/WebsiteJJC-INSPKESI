# 🎨 Skema Warna Dashboard Petugas Lapangan

## 📊 Kartu Statistik (Statistics Cards)

### 1. Total Inspeksi
- **Gradient**: Blue-500 ke Blue-700
- **Hex**: `#3b82f6` → `#60a5fa` (lebih gelap)
- **Icon Background**: Blue-600 dengan opacity 50%
- **Visual**: Biru cerah yang profesional

### 2. Disetujui
- **Gradient**: Emerald-500 ke Emerald-700
- **Hex**: `#10b981` → `#059669`
- **Icon Background**: Emerald-600 dengan opacity 50%
- **Visual**: Hijau emerald yang mewah dan positif

### 3. Ditolak
- **Gradient**: Rose-500 ke Rose-700
- **Hex**: `#f43f5e` → `#be123c`
- **Icon Background**: Rose-600 dengan opacity 50%
- **Visual**: Merah rose yang elegan (tidak terlalu mencolok)

### 4. Menunggu Persetujuan
- **Gradient**: Orange-500 ke Orange-700
- **Hex**: `#f97316` → `#c2410c`
- **Icon Background**: Orange-600 dengan opacity 50%
- **Visual**: Orange yang hangat untuk status pending

---

## 📈 Diagram 1: Status Persetujuan (Pie Chart)

### Background Container
- **Gradient**: Purple-50 ke Pink-50
- **Border**: Purple-100
- **Visual**: Background pastel ungu-pink yang lembut

### Data Warna
1. **Disetujui** - `#22c55e` (Green-500)
   - Hijau cerah yang mudah terlihat
   
2. **Ditolak** - `#f43f5e` (Rose-500)
   - Rose yang matching dengan kartu statistik
   
3. **Menunggu** - `#f97316` (Orange-500)
   - Orange matching dengan kartu pending

### Icon Header
- **Background**: Purple-100
- **Icon Color**: Purple-600

---

## 📊 Diagram 2: Kategori Kendaraan (Pie Chart)

### Background Container
- **Gradient**: Blue-50 ke Indigo-50
- **Border**: Blue-100
- **Visual**: Background pastel biru-indigo

### Data Warna
1. **Plaza** - `#3b82f6` (Blue-500)
   - Biru standar untuk operasional
   
2. **Derek** - `#8b5cf6` (Violet-500)
   - Ungu violet untuk pembeda yang jelas
   
3. **Kamtib** - `#eab308` (Yellow-500)
   - Kuning cerah untuk keamanan
   
4. **Rescue** - `#ec4899` (Pink-500)
   - Pink untuk rescue (emergency)

### Icon Header
- **Background**: Blue-100
- **Icon Color**: Blue-600

---

## 📉 Diagram 3: Tren Inspeksi (Bar Chart)

### Background Container
- **Gradient**: Teal-50 ke Emerald-50
- **Border**: Teal-100
- **Visual**: Background pastel teal-emerald

### Data Warna
- **Bar Fill**: `#14b8a6` (Teal-500)
- **Bar Radius**: 8px (rounded top corners)
- **Grid**: Dash pattern (3,3)

### Icon Header
- **Background**: Teal-100
- **Icon Color**: Teal-600

---

## 🎯 Prinsip Desain Warna

### 1. **Kontras yang Jelas**
- Setiap diagram memiliki background gradient yang berbeda
- Warna data tidak overlap antara diagram
- Mudah dibedakan secara visual

### 2. **Konsistensi Makna**
- Hijau = Positif (Approved, Success)
- Merah/Rose = Negatif (Rejected, Error)
- Orange = Pending (Waiting, Caution)
- Biru = Netral/Informasi

### 3. **Accessibility**
- Warna yang dipilih mempertimbangkan color blindness
- Kontras yang cukup untuk readability
- Tidak hanya mengandalkan warna (ada label text)

### 4. **Visual Hierarchy**
- Kartu statistik menggunakan gradient bold
- Background diagram menggunakan pastel soft
- Data dalam diagram menggunakan solid vibrant colors

---

## 🌈 Palette Lengkap

### Primary Colors
```
Blue:    #3b82f6 (Plaza, Total)
Green:   #22c55e (Approved)
Rose:    #f43f5e (Rejected)
Orange:  #f97316 (Pending)
```

### Secondary Colors
```
Violet:  #8b5cf6 (Derek)
Yellow:  #eab308 (Kamtib)
Pink:    #ec4899 (Rescue)
Teal:    #14b8a6 (Trend Chart)
```

### Background Gradients
```
Blue Cards:      from-blue-500 to-blue-700
Emerald Cards:   from-emerald-500 to-emerald-700
Rose Cards:      from-rose-500 to-rose-700
Orange Cards:    from-orange-500 to-orange-700

Status Chart:    from-purple-50 to-pink-50
Category Chart:  from-blue-50 to-indigo-50
Trend Chart:     from-teal-50 to-emerald-50
```

---

## 📱 Responsive Behavior

### Desktop
- 4 kartu dalam 1 baris (grid-cols-4)
- 3 diagram dalam 1 baris (grid-cols-3)
- Spacing optimal dengan gap-6 dan gap-8

### Tablet/Mobile
- Kartu stack vertical (grid-cols-1)
- Diagram stack vertical (grid-cols-1)
- Maintains color scheme dan visual hierarchy

---

## ✨ Efek Visual

### Kartu Statistik
- **Shadow**: shadow-lg
- **Hover**: shadow-xl dengan transition
- **Text**: Angka bold 3xl, label medium sm

### Diagram Container
- **Border**: 1px solid (matching dengan background color)
- **Rounded**: rounded-xl
- **Padding**: p-6 konsisten

### Icons
- **Size**: w-5 h-5 untuk icon, w-8 h-8 untuk container
- **Background**: Warna lighter dari tema
- **Rounded**: rounded-lg

---

**Catatan**: Semua warna menggunakan Tailwind CSS color palette untuk konsistensi dan maintainability.
