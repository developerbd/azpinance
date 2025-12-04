'use server';

import { createClient } from '@/lib/supabase/server';
import { notifyAdmins } from '@/lib/notifications';

interface NotifyContactCreatedParams {
    contactId: string;
    contactName: string;
    contactType: string;
}

export async function notifyContactCreated({ contactId, contactName, contactType }: NotifyContactCreatedParams) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

    await notifyAdmins({
        title: 'New Contact Created',
        message: `A new ${contactType} contact "${contactName}" has been created by ${user.email}.`,
        type: 'info',
        link: `/contacts/${contactId}`
    });
}
