import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const { para, assunto, corpo } = await request.json();

    const user = process.env.EMAIL_USER;
    // Remove qualquer espaço em branco acidental copiado do painel do Google
    const pass = process.env.EMAIL_PASS?.replace(/\s/g, ''); 

    if (!user || !pass) {
      return NextResponse.json(
        { erro: "Variáveis EMAIL_USER ou EMAIL_PASS em falta na Vercel." },
        { status: 500 }
      );
    }

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: user,
        pass: pass,
      },
    });

    // Testa a autenticação no Gmail antes de tentar disparar
    await transporter.verify();

    await transporter.sendMail({
      from: user,
      to: para,
      subject: assunto,
      text: corpo,
    });

    return NextResponse.json({ status: "E-mail enviado com sucesso!" });
  } catch (error: any) {
    console.error("Erro interno nodemailer:", error);
    return NextResponse.json({ erro: error.message }, { status: 500 });
  }
}