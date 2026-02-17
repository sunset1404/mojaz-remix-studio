

# خطة التفريق بين واجهات الطالب والمقرئ

## المشكلة الحالية
حالياً جميع الصفحات مصممة للطالب فقط، والمقرئ يتم توجيهه إلى صفحة "قيد المراجعة" بشكل دائم. نحتاج بنية تدعم عرض صفحات مختلفة لكل دور.

## الحل المقترح: Hook مركزي + توجيه ذكي

### 1. إنشاء Hook مركزي `useUserRole`
- يجلب دور المستخدم من جدول `user_roles` مرة واحدة ويخزنه في Context
- يوفر قيمة الدور (`student` / `reciter`) لجميع المكونات
- يمنع الاستعلامات المتكررة لقاعدة البيانات

### 2. تحديث `AuthContext`
- إضافة حقل `role` إلى السياق بجانب `user` و `session`
- جلب الدور تلقائياً عند تسجيل الدخول

### 3. توجيه الصفحات حسب الدور

```text
المسار          |  الطالب              |  المقرئ
----------------|----------------------|---------------------
/               |  Index (الحالية)     |  ReciterHome (جديدة)
/reciters       |  قائمة المقرئين      |  -- (غير متاح)
/subscription   |  اشتراكاتي          |  -- أو نسخة مختلفة
/achievements   |  إنجازاتي           |  إنجازاتي (مشتركة)
/weekly-plan    |  خطتي الأسبوعية     |  جدول الجلسات
/profile        |  ملفي الشخصي        |  ملفي الشخصي (مشتركة مع اختلافات)
```

### 4. شريط التنقل السفلي مختلف لكل دور

- **الطالب**: الرئيسية، المقرئون، الاشتراك، إنجازاتي، حسابي
- **المقرئ**: الرئيسية، طلابي، الجلسات، إنجازاتي، حسابي

### 5. مكون `RoleBasedRoute` 
- مكون يستقبل صفحة الطالب وصفحة المقرئ ويعرض المناسبة تلقائياً

---

## التفاصيل التقنية

### الملفات الجديدة
| الملف | الوصف |
|-------|-------|
| `src/hooks/useUserRole.ts` | Hook لجلب الدور من قاعدة البيانات |
| `src/components/RoleBasedRoute.tsx` | مكون يعرض الصفحة المناسبة حسب الدور |

### الملفات المعدّلة
| الملف | التعديل |
|-------|---------|
| `src/contexts/AuthContext.tsx` | إضافة `role` إلى السياق |
| `src/App.tsx` | تحديث `ProtectedRoute` لاستخدام الدور من السياق، واستخدام `RoleBasedRoute` |
| `src/components/BottomNav.tsx` | عرض تبويبات مختلفة حسب الدور |

### مثال على الاستخدام في التوجيه

```tsx
// في App.tsx
<Route path="/" element={
  <ProtectedRoute>
    <RoleBasedRoute
      student={<><Index /><BottomNav /></>}
      reciter={<><ReciterHome /><BottomNav /></>}
    />
  </ProtectedRoute>
} />
```

### مثال على BottomNav الديناميكي

```tsx
const studentTabs = [
  { path: "/profile", icon: User, label: "حسابي" },
  { path: "/achievements", icon: Trophy, label: "إنجازاتي" },
  { path: "/", icon: Home, label: "الرئيسية", main: true },
  { path: "/reciters", icon: Mic, label: "المقرئون" },
  { path: "/subscription", icon: Crown, label: "الاشتراك" },
];

const reciterTabs = [
  { path: "/profile", icon: User, label: "حسابي" },
  { path: "/achievements", icon: Trophy, label: "إنجازاتي" },
  { path: "/", icon: Home, label: "الرئيسية", main: true },
  { path: "/my-students", icon: Users, label: "طلابي" },
  { path: "/sessions", icon: Calendar, label: "الجلسات" },
];
```

## ملاحظة
هذه الخطة تبني الهيكل الأساسي فقط. صفحات المقرئ (مثل الرئيسية، طلابي، الجلسات) ستكون فارغة مبدئياً ويمكن بناء محتواها لاحقاً خطوة بخطوة.

