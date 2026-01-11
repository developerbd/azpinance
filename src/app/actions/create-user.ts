'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

import { createUserSchema } from '@/lib/schemas';

export async function createUser(formData: FormData) {
    const supabase = await createClient();

    // 1. Check if current user is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: 'Unauthorized' };
    }

    const { data: currentUserProfile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

    if (!['admin', 'supervisor'].includes(currentUserProfile?.role)) {
        return { error: 'Forbidden: Admin or Supervisor access required' };
    }

    // 2. Extract and Validate data
    const rawData = {
        email: formData.get('email'),
        password: formData.get('password'),
        fullName: formData.get('fullName'),
        username: formData.get('username'),
        role: formData.get('role'),
    };

    const validation = createUserSchema.safeParse(rawData);

    if (!validation.success) {
        return { error: validation.error.issues[0].message };
    }

    const { email, password, fullName, username, role } = validation.data;

    // Supervisor restriction: Cannot create Admin or Supervisor
    if (currentUserProfile?.role === 'supervisor' && ['admin', 'supervisor'].includes(role)) {
        return { error: 'Forbidden: Supervisors cannot create Admin or Supervisor accounts' };
    }

    // 3. Create user using Admin Client
    try {
        const adminSupabase = createAdminClient();

        const { data, error } = await adminSupabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // Auto-confirm email
            user_metadata: {
                full_name: fullName,
                username: username,
            },
        });

        if (error) throw error;

        // 4. Update role and header preference in public.users
        // We do this regardless of role to ensure header preference is set correctly
        if (data.user) {
            const updates: any = {
                header_display_preference: 'avatar_full_name'
            };

            if (role !== 'guest') {
                updates.role = role;
            }
            if (username) {
                updates.username = username;
            }
            // Admin created users should be active by default
            updates.status = 'active';

            const { error: updateError } = await adminSupabase
                .from('users')
                .update(updates)
                .eq('id', data.user.id);

            if (updateError) {
                console.error("Failed to update user details:", updateError);
            }
        }

        revalidatePath('/settings');
        return { success: true, userId: data.user?.id };
    } catch (error: any) {
        console.error("Create user error:", error);
        return { error: error.message || 'Failed to create user' };
    }
}
