import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const { para, assunto, corpo } = await request.json();

    // Alterado para procurar exatamente os nomes que estão na sua Vercel
    const user = process.env.EMAIL_REMETENTE;
    const pass = process.env.SENHA_APP_EMAIL?.replace(/\s/g, ''); 

    if (!user || !pass) {
      return NextResponse.json(
        { erro: "Variáveis EMAIL_REMETENTE ou SENHA_APP_EMAIL em falta na Vercel." },
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