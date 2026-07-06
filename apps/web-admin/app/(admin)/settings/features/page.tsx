import SettingsSectionPage from '../settings-section-page';

export default function FeaturesSettingsPage() {
  return (
    <SettingsSectionPage
      group="features"
      title="Feature Flag Settings"
      description="เปิด/ปิดฟีเจอร์โดยไม่ต้อง deploy ใหม่"
      fields={[
        { key: 'registration_enabled', label: 'เปิดสมัครสมาชิก', type: 'checkbox' },
        { key: 'login_enabled', label: 'เปิดเข้าสู่ระบบ', type: 'checkbox' },
        { key: 'deposit_enabled', label: 'เปิดฝากเงิน', type: 'checkbox' },
        { key: 'withdraw_enabled', label: 'เปิดถอนเงิน', type: 'checkbox' },
        { key: 'promotion_enabled', label: 'เปิดโปรโมชั่น', type: 'checkbox' },
        { key: 'event_enabled', label: 'เปิดกิจกรรม', type: 'checkbox' },
        { key: 'vip_enabled', label: 'เปิด VIP', type: 'checkbox' },
        { key: 'referral_enabled', label: 'เปิด Referral', type: 'checkbox' },
        { key: 'coupon_enabled', label: 'เปิด Coupon', type: 'checkbox' },
        { key: 'provider_enabled', label: 'เปิด Provider', type: 'checkbox' },
        { key: 'articles_enabled', label: 'เปิด SEO / Articles', type: 'checkbox' },
      ]}
    />
  );
}
