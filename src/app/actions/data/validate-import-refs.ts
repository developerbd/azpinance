'use server';

import { createClient } from '@/lib/supabase/server';

export interface ValidationResult {
    contacts: Record<string, string | null>; // Name -> ID (or null if not found)
    accounts: Record<string, string | null>; // Name -> ID
}

export async function validateImportRefs(
    contactNames: string[],
    accountNames: string[]
): Promise<ValidationResult> {
    const supabase = await createClient();

    // 1. Fetch Contacts
    // Filter out duplicates and empty strings
    const uniqueContacts = Array.from(new Set(contactNames.filter(Boolean)));
    const uniqueAccounts = Array.from(new Set(accountNames.filter(Boolean)));

    const contactsMap: Record<string, string | null> = {};
    const accountsMap: Record<string, string | null> = {};

    // Initialize with null
    uniqueContacts.forEach(name => contactsMap[name] = null);
    uniqueAccounts.forEach(name => accountsMap[name] = null);

    if (uniqueContacts.length > 0) {
        const { data: contacts } = await supabase
            .from('contacts')
            .select('id, name')
            .in('name', uniqueContacts);

        contacts?.forEach(c => {
            contactsMap[c.name] = c.id;
        });
    }

    if (uniqueAccounts.length > 0) {
        const { data: accounts } = await supabase
            .from('financial_accounts')
            .select('id, name')
            .in('name', uniqueAccounts);

        accounts?.forEach(a => {
            accountsMap[a.name] = a.id;
        });
    }

    return {
        contacts: contactsMap,
        accounts: accountsMap
    };
}
