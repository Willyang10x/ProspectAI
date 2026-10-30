import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const { para, assunto, corpo } = await request.json();

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return NextResponse.json(
        { erro: "Credenciais de e-mail não configuradas na Vercel." },
        { status: 500 }
      );
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: para,
      subject: assunto,
      text: corpo,
    });

    return NextResponse.json({ status: "E-mail enviado com sucesso!" });
  } catch (error: any) {
    console.error("Erro no envio do e-mail:", error);
    return NextResponse.json({ erro: error.message }, { status: 500 });
  }
}