/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface EmailChangeEmailProps {
  siteName: string
  oldEmail: string
  email: string
  newEmail: string
  confirmationUrl: string
}

const LOGO_URL =
  'https://cfihcvudcwujylipqngk.supabase.co/storage/v1/object/public/reciter-assets/email%2Flogo-mojaz.png'

export const EmailChangeEmail = ({
  oldEmail,
  newEmail,
  confirmationUrl,
}: EmailChangeEmailProps) => (
  <Html lang="ar" dir="rtl">
    <Head />
    <Preview>تأكيد تغيير البريد الإلكتروني في مجاز</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Img src={LOGO_URL} alt="مجاز" width="96" height="96" style={logo} />
          <Heading style={brand}>مجاز</Heading>
        </Section>
        <Section style={card}>
          <Heading style={h1}>تأكيد تغيير البريد الإلكتروني</Heading>
          <Text style={text}>
            استلمنا طلباً لتغيير البريد الإلكتروني المرتبط بحسابك في تطبيق <strong>مجاز</strong> من{' '}
            <strong>{oldEmail}</strong> إلى <strong>{newEmail}</strong>.
          </Text>
          <Text style={text}>
            اضغط على الزر أدناه لتأكيد التغيير:
          </Text>
          <Section style={buttonWrap}>
            <Button style={button} href={confirmationUrl}>
              تأكيد التغيير
            </Button>
          </Section>
          <Text style={hint}>
            إذا لم تطلب هذا التغيير، يرجى تأمين حسابك فوراً.
          </Text>
        </Section>
        <Text style={footer}>
          © {new Date().getFullYear()} تطبيق مجاز · جميع الحقوق محفوظة
        </Text>
      </Container>
    </Body>
  </Html>
)

export default EmailChangeEmail

const main = { backgroundColor: '#ffffff', fontFamily: '"Cairo", "Tahoma", Arial, sans-serif', padding: '24px 0' }
const container = { maxWidth: '560px', margin: '0 auto', padding: '0 16px' }
const header = { textAlign: 'center' as const, padding: '8px 0 16px' }
const logo = { display: 'inline-block', borderRadius: '16px' }
const brand = { fontSize: '20px', color: '#0f766e', margin: '8px 0 0', fontWeight: 'bold' as const }
const card = {
  backgroundColor: '#ffffff',
  border: '1px solid #e5f3f1',
  borderTop: '4px solid #14b8a6',
  borderRadius: '16px',
  padding: '28px 24px',
  textAlign: 'right' as const,
  boxShadow: '0 4px 12px rgba(20, 184, 166, 0.08)',
}
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#0f172a', margin: '0 0 16px' }
const text = { fontSize: '15px', color: '#334155', lineHeight: '1.8', margin: '0 0 16px' }
const buttonWrap = { textAlign: 'center' as const, margin: '24px 0 16px' }
const button = {
  backgroundColor: '#14b8a6',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold' as const,
  borderRadius: '12px',
  padding: '14px 36px',
  textDecoration: 'none',
  display: 'inline-block',
  borderBottom: '3px solid #d4af37',
}
const hint = { fontSize: '13px', color: '#64748b', lineHeight: '1.7', margin: '20px 0 0' }
const footer = { fontSize: '12px', color: '#94a3b8', textAlign: 'center' as const, margin: '24px 0 0' }
