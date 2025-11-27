import bcrypt from 'bcryptjs';
import db from '../../lib/db';
import { generateToken } from '../../lib/jwt';
import { validateUsername } from '../../lib/profanity-filter';
import { applyRateLimit } from '../../lib/rate-limit';
import { sendWelcomeEmail } from '../../lib/email';
import { validatePassword, validateEmail } from '../../lib/input-validation';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Aplicar rate limiting (3 registros por hora por IP)
  const rateLimitResult = await applyRateLimit('register', req, res);
  if (rateLimitResult) return rateLimitResult;

  const { name, password, email, enableNotifications } = req.body;
  
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

  // Validar formato de email usando el módulo de validación
  if (!validateEmail(email)) {
    return res.status(400).json({ error: 'Por favor ingresa un email válido' });
  }

  // Validar contraseña usando el módulo de validación
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    return res.status(400).json({ 
      error: passwordValidation.errors[0] || 'Contraseña inválida'
    });
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

    // Insertar usuario con contraseña y preferencias de notificación
    const notificationsEnabled = enableNotifications === true;
    const result = await db.query(
      `INSERT INTO users (name, email, password_hash, email_verified, notifications_enabled, created_at) 
       VALUES ($1, $2, $3, false, $4, NOW()) 
       RETURNING id, name, email, is_admin, notifications_enabled, created_at`,
      [username, userEmail, passwordHash, notificationsEnabled]
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

    // Si el usuario activó notificaciones, crear notificación de bienvenida
    if (notificationsEnabled) {
      try {
        await db.query(
          `INSERT INTO notifications (user_id, type, title, message, created_at)
           VALUES ($1, 'system', '¡Bienvenido a Quizy!', 'Has activado las notificaciones. Te mantendremos informado sobre tu progreso y novedades.', NOW())`,
          [user.id]
        );
      } catch (err) {
        console.error('Error creando notificación de bienvenida:', err);
      }
    }

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
