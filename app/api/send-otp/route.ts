import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function POST(req: NextRequest) {
  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json(
        { error: "Email và mã OTP là bắt buộc" },
        { status: 400 }
      );
    }

    await transporter.sendMail({
      from: `"Pocket Trade" <${process.env.SMTP_EMAIL}>`,
      to: email,
      subject: "Mã OTP đặt lại mật khẩu - Pocket Trade",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #1e293b; text-align: center;">Pocket Trade</h2>
          <div style="background: #f8fafc; border-radius: 8px; padding: 24px; margin: 20px 0;">
            <p style="color: #475569; font-size: 16px; margin-bottom: 16px;">
              Bạn đã yêu cầu đặt lại mật khẩu. Đây là mã OTP của bạn:
            </p>
            <div style="background: #1e293b; color: white; font-size: 32px; font-weight: bold; text-align: center; padding: 16px; border-radius: 8px; letter-spacing: 8px;">
              ${code}
            </div>
            <p style="color: #64748b; font-size: 14px; margin-top: 16px; text-align: center;">
              Mã có hiệu lực trong 10 phút
            </p>
          </div>
          <p style="color: #94a3b8; font-size: 12px; text-align: center;">
            Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.
          </p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Send email error:", error);
    return NextResponse.json(
      { error: "Không thể gửi email" },
      { status: 500 }
    );
  }
}
