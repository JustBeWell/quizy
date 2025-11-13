import bcrypt from 'bcryptjs';
import db from '../../lib/db';
import { generateToken } from '../../lib/jwt';
import { validateUsername } from '../../lib/profanity-filter';
import { applyRateLimit } from '../../lib/rate-limit';
import { sendWelcomeEmail } from '../../lib/email';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Aplicar rate limiting (3 registros por hora por IP)
  const rateLimitResult = await applyRateLimit('register', req, res);
  if (rateLimitResult) return rateLimitResult;

  const { name, password, email } = req.body;
  
  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return res.status(400).json({ error: 'Nombre de usuario inválido' });
  }

  const username = name.trim();

  // Validar palabras inapropiadas en el nombre de usuario
  const usernameValidation = validateUsername(username);
  if (!usernameValidation.valid) {
    return res.status(400).json({ error: usernameValidation.error });
  }

  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'El email es requerido' });
  }

  // Validar formato de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return res.status(400).json({ error: 'Por favor ingresa un email válido' });
  }

  if (!password || password.length < 6) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
  }

  const userEmail = email.trim().toLowerCase();

  try {
    // Validar nombre de usuario contra palabras inapropiadas
    console.log('🔍 Validando username:', username)
    const usernameValidation = validateUsername(username)
    console.log('✅ Resultado validación:', usernameValidation)
    
    if (!usernameValidation.valid) {
      console.log('❌ Username rechazado:', usernameValidation.error)
      return res.status(400).json({ error: usernameValidation.error })
    }

    // Verificar si el usuario ya existe
    const checkResult = await db.query(
      'SELECT id, name FROM users WHERE name = $1 OR email = $2',
      [username, userEmail]
    );

    if (checkResult.rows.length > 0) {
      const existing = checkResult.rows[0];
      if (existing.name === username) {
        return res.status(409).json({ error: 'Este nombre de usuario ya está en uso' });
      } else {
        return res.status(409).json({ error: 'Este email ya está registrado' });
      }
    }

    // Hashear la contraseña
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insertar usuario con contraseña
    const result = await db.query(
      `INSERT INTO users (name, email, password_hash, email_verified, created_at) 
       VALUES ($1, $2, $3, false, NOW()) 
       RETURNING id, name, email, is_admin, created_at`,
      [username, userEmail, passwordHash]
    );

    const user = result.rows[0];

    // Generar JWT token
    const token = generateToken({
      id: user.id,
      name: user.name,
      email: user.email,
      is_admin: user.is_admin || false
    });

    // Enviar email de bienvenida (no bloqueante)
    sendWelcomeEmail(user.email, user.name).catch(err => {
      console.error('Error enviando email de bienvenida:', err)
    })

    return res.status(200).json({ 
      success: true, 
      token,
      user 
    });

  } catch (err) {
    console.error('Error registering user:', err);
    return res.status(500).json({ error: 'Error al registrar usuario' });
  }
}
