# EduAsses - Responsive Design Guide

## Nguyên tắc cơ bản

### Mobile-First Approach
Luôn thiết kế cho mobile trước, sau đó mở rộng cho desktop. Điều này đảm bảo trải nghiệm tốt nhất cho tất cả người dùng.

### Breakpoints
EduAsses sử dụng các breakpoint tiêu chuẩn của Tailwind CSS:
- **xs**: < 640px (default)
- **sm**: 640px
- **md**: 768px
- **lg**: 1024px
- **xl**: 1280px
- **2xl**: 1536px

### Touch Targets
Đảm bảo tất cả các phần tử có thể tương tác (buttons, links, inputs) đều có kích thước tối thiểu 44x44px (tương đương với h-11 w-11 trong Tailwind) trên thiết bị mobile.

### Responsive Typography
Sử dụng các class trong `lib/typography.ts` để đảm bảo text scale đúng cách trên các kích thước màn hình khác nhau.

### Accessibility
- Đảm bảo contrast ratio (WCAG AA minimum)
- Hỗ trợ keyboard navigation
- Thêm ARIA attributes khi cần thiết
- Không phụ thuộc hoàn toàn vào hover states

## Components Responsive

### Container
Sử dụng component Container để đảm bảo content có chiều rộng nhất quán và padding phù hợp:

```tsx
// Default - max-width: 1024px
<Container>
  <p>Content with consistent max-width and padding</p>
</Container>

// Smaller container
<Container size="sm">
  <p>Content with smaller max-width</p>
</Container>

// Full width
<Container size="full">
  <p>Full width content with padding</p>
</Container>
```

### Grid
Sử dụng Grid component cho layout dạng lưới với các tùy chọn responsive:

```tsx
// Basic grid with 1 column on mobile, 2 on tablets, 3 on desktops
<Grid cols={1} mdCols={2} lgCols={3} gap={4}>
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</Grid>
```

### Section
Sử dụng Section để tạo các phần với padding dọc nhất quán:

```tsx
<Section spacing="md">
  <h2>Section Title</h2>
  <p>Content with consistent vertical spacing</p>
</Section>
```

### Typography
Use Typography component for responsive text:

```tsx
<Typography variant="h1">Page Title</Typography>
<Typography variant="body">Regular text content</Typography>
<Typography variant="small">Small text for metadata</Typography>
```

### Responsive Visibility
Show or hide content based on screen size:

```tsx
// Only show on mobile
<ResponsiveVisibility onlyXs>
  <p>Mobile only content</p>
</ResponsiveVisibility>

// Hide on mobile
<ResponsiveVisibility hideOnXs>
  <p>Hidden on mobile</p>
</ResponsiveVisibility>
```

### useBreakpoint Hook
Use this hook to implement logic based on current breakpoint:

```tsx
function MyComponent() {
  const { breakpoint, isAboveMd } = useBreakpoint()
  
  return (
    <div>
      {isAboveMd ? (
        <p>Desktop layout</p>
      ) : (
        <p>Mobile layout</p>
      )}
    </div>
  )
}
```

## Layout Components

### DashboardLayout
Layout for dashboard page with collapsible sidebar on mobile:

```tsx
<DashboardLayout 
  sidebar={<Sidebar />}
  header={<PageHeader title="Dashboard" />}
>
  <p>Main content</p>
</DashboardLayout>
```

### AuthLayout
Layout for login/register pages with responsive background and form:

```tsx
<AuthLayout
  backgroundImage="/images/auth-bg.jpg"
  sideContent={<h1>Welcome to EduAsses</h1>}
  logo={<Logo />}
  footer={<p>© 2024 EduAsses</p>}
>
  <LoginForm />
</AuthLayout>
```

### QuizLayout
Layout for quiz/exam pages with responsive navigation and sidebar:

```tsx
<QuizLayout
  title="Math Quiz"
  currentQuestion={3}
  totalQuestions={10}
  onPrevious={handlePrevious}
  onNext={handleNext}
  timeRemaining={900} // 15 minutes
  sidebarContent={<QuestionsList />}
>
  <QuizContent />
</QuizLayout>
```

## Testing Responsive Design

### SpacingDebug Component
Sử dụng component SpacingDebug để debug grid và breakpoints trong khi phát triển:

```tsx
// Thêm vào _app.tsx hoặc layout.tsx trong môi trường dev
{process.env.NODE_ENV === 'development' && <SpacingDebug />}
```

Bấm Ctrl+Shift+G để toggle grid overlay.

### Testing Checklist
- Kiểm tra trên nhiều kích thước màn hình sử dụng DevTools
- Kiểm tra trên thiết bị thật nếu có thể
- Kiểm tra với bàn phím (keyboard navigation)
- Kiểm tra với screen reader
- Kiểm tra performance và loading states

## Best Practices

- Sử dụng các đơn vị tương đối (rem, %, vw) thay vì px cố định
- Hạn chế max-width và min-width tuyệt đối
- Sử dụng Flexbox và Grid cho layout
- Tránh overflow-x: hidden nếu có thể
- Kết hợp các media queries với một mục đích cụ thể
- Giảm thiểu số lượng HTTP requests trên mobile
- Tối ưu hóa images và assets

---

## Quy trình làm việc với Responsive

1. Thiết kế mobile trước
2. Test functionality trên điện thoại
3. Mở rộng UI cho tablet 
4. Mở rộng UI cho desktop
5. Kiểm tra lại trên tất cả các kích thước
6. Optimize performance

Luôn giữ nguyên tắc "Nội dung là vua" - đảm bảo nội dung luôn dễ đọc và dễ tiếp cận trước khi tập trung vào layout. 