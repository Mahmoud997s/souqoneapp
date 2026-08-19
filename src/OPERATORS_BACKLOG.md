# Operators Wizard — Backlog

تم اكتشاف هذه الفجوات في جلسة تدقيق معمارية بتاريخ 2026-08-19.
**لا تُنفَّذ تلقائياً — تحتاج موافقة صريحة قبل التنفيذ.**

---

## [BACKLOG-1] تكرار Image Picker Logic

**الخطورة**: 🟡 منخفضة (فيه فرق وظيفي حقيقي بين الاستخدامين)

**المشكلة**: منطق طلب الإذن وإطلاق الـ Image Picker متطابق في ملفين:
- [`src/hooks/useEquipmentFormLogic.ts`](file:///c:/Users/DELL/Desktop/Souqoneapp/src/hooks/useEquipmentFormLogic.ts) — L30-56: يحفظ الـ URI محلياً بدون رفع فوري
- [`src/hooks/useOperatorFormLogic.ts`](file:///c:/Users/DELL/Desktop/Souqoneapp/src/hooks/useOperatorFormLogic.ts) — L39-75: يرفع الصورة للسيرفر فوراً (`uploadsApi.single()`)

**الكود المتطابق** (permission + launch options):
```typescript
// كلاهما:
const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
// ...
const result = await ImagePicker.launchImageLibraryAsync({
  mediaTypes: ImagePicker.MediaTypeOptions.Images,
  allowsMultipleSelection: true,
  quality: 0.8,
})
```

**الحل المقترح**: استخراج `useImagePicker(onAssetsPicked: (assets) => Promise<void>)` hook مشترك يأخذ callback — الـ equipment يمرر callback يحفظ URI، الـ operators يمرر callback يرفع الصورة.

**السبب في التأجيل**: الفرق الوظيفي (upload فوري vs تأجيل) يجعل الاستخراج أقل إلحاحاً. لا أثر للتكرار الحالي على الـ UX.

---

## [BACKLOG-2] تكرار governorateId Validation Pattern

**الخطورة**: 🟢 منخفضة جداً

**المشكلة**: نفس 3 أسطر التحقق مكررة في:
- [`src/hooks/useEquipmentValidation.ts`](file:///c:/Users/DELL/Desktop/Souqoneapp/src/hooks/useEquipmentValidation.ts) — L59-66
- [`src/hooks/useOperatorValidation.ts`](file:///c:/Users/DELL/Desktop/Souqoneapp/src/hooks/useOperatorValidation.ts) — L36-41

**الكود المكرر**:
```typescript
if (!formData.governorateId) {
  errors.governorate = 'يرجى اختيار المحافظة'
}
if (!formData.wilayaId) {
  errors.city = 'يرجى اختيار ...'
}
```

**الحل المقترح**: `validateLocationIds(formData, errors)` utility function في `src/utils/validation-helpers.ts`.

**السبب في التأجيل**: 3 أسطر فقط — الاستخراج يضيف تعقيداً أكثر مما يوفر. ينفع يتنفذ لو اتضافت أنواع كيانات جديدة تتطلب نفس التحقق.

---

## الفجوات المحلولة (للتوثيق)

| الفجوة | تاريخ الحل | الملف |
|---|---|---|
| تكرار payload builder (add vs edit) | 2026-08-19 | [`src/utils/operator-payload.ts`](file:///c:/Users/DELL/Desktop/Souqoneapp/src/utils/operator-payload.ts) |
| اختلاف `currency` (add vs edit) | 2026-08-19 | [`src/utils/operator-payload.ts`](file:///c:/Users/DELL/Desktop/Souqoneapp/src/utils/operator-payload.ts) |
| تكرار منطق التحقق في الـ store | 2026-08-19 | [`src/store/operatorWizardStore.ts`](file:///c:/Users/DELL/Desktop/Souqoneapp/src/store/operatorWizardStore.ts) |
