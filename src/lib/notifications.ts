import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

type NotificationType = 'info' | 'success' | 'warning' | 'error';

interface CreateNotificationParams {
    userId: string;
    title: string;
    message: string;
    type: NotificationType;
    link?: string;
}

export async function createNotification({
    userId,
    title,
    message,
    type,
    link,
}: CreateNotificationParams) {
    const supabase = await createClient();

    // We might need service role key if we are notifying OTHER users and RLS prevents it.
    // For now, let's assume the current user has permission or we use a service role client if needed.
    // Actually, standard client might fail if RLS says "only insert for self".
    // My policy said "Authenticated can insert", so it should be fine.

    const { error } = await supabase.from('notifications').insert({
        user_id: userId,
        title,
        message,
        type,
        link,
    });

    if (error) {
        console.error('Error creating notification:', error);
    }
}

export async function notifyAdmins({
    title,
    message,
    type,
    link,
}: Omit<CreateNotificationParams, 'userId'>) {
    // Use Service Role Client if available to bypass RLS
    let supabase;
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        supabase = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );
    } else {
        console.warn('SUPABASE_SERVICE_ROLE_KEY not found. Notifications might fail due to RLS.');
        supabase = await createClient();
    }

    // Fetch all admins
    const { data: admins } = await supabase
        .from('users')
        .select('id, email')
        .eq('role', 'admin');

    if (admins && admins.length > 0) {
        // 1. In-App Notifications (Always send)
        const notifications = admins.map(admin => ({
            user_id: admin.id,
            title,
            message,
            type,
            link,
        }));

        const { error } = await supabase.from('notifications').insert(notifications);
        if (error) {
            console.error('Error notifying admins:', error);
        }

        // 2. External Notifications - System-Wide Settings
        const { data: systemSettings } = await supabase
            .from('system_settings')
            .select('discord_enabled, discord_webhook_url')
            .eq('id', 1)
            .single();

        // Send Discord notification if enabled
        if (systemSettings?.discord_enabled && systemSettings?.discord_webhook_url) {
            const webhookUrl = systemSettings.discord_webhook_url.trim();
            if (webhookUrl) {
                try {
                    await fetch(webhookUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            content: `**${title}**\n${message}\n${link ? `[View Link](${process.env.NEXT_PUBLIC_APP_URL}${link})` : ''}`,
                        }),
                    });
                    console.log(`[Notifications] Discord notification sent to system webhook`);
                } catch (err) {
                    console.error('Failed to send Discord notification', err);
                }
            }
        }

        // 3. Email Notifications (Per-User)
        const adminIds = admins.map(a => a.id);
        const { data: settings } = await supabase
            .from('notification_settings')
            .select('*')
            .in('user_id', adminIds);

        if (settings) {

            for (const setting of settings) {
                // Email (Real Sending)
                if (setting.email_enabled) {
                    const email = setting.email_address || admins.find(a => a.id === setting.user_id)?.email;
                    if (email) {
                        try {
                            // Fetch SMTP settings
                            const { data: smtp } = await supabase
                                .from('smtp_settings')
                                .select('*')
                                .eq('id', 1)
                                .single();

                            if (smtp && smtp.host && smtp.user && smtp.password) {
                                const transporter = nodemailer.createTransport({
                                    host: smtp.host,
                                    port: smtp.port || 587,
                                    secure: smtp.port === 465, // true for 465, false for other ports
                                    auth: {
                                        user: smtp.user,
                                        pass: smtp.password,
                                    },
                                });

                                await transporter.sendMail({
                                    from: `"${smtp.sender_name || 'Biz Ad Finance'}" <${smtp.from_email || smtp.user}>`,
                                    to: email,
                                    subject: `[${smtp.sender_name || 'Biz Ad Finance'}] ${title}`,
                                    text: `${message}\n\n${link ? `View details: ${process.env.NEXT_PUBLIC_APP_URL}${link}` : ''}`,
                                    html: `
                                        <div style="font-family: sans-serif; padding: 20px;">
                                            <h2>${title}</h2>
                                            <p>${message}</p>
                                            ${link ? `<p><a href="${process.env.NEXT_PUBLIC_APP_URL}${link}" style="background: #0070f3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Details</a></p>` : ''}
                                        </div>
                                    `,
                                });

                            } else {
                                console.warn('SMTP settings not configured, skipping email.');
                            }
                        } catch (err) {
                            console.error('Failed to send email:', err);
                        }
                    }
                }
            }
        }
    }
}
