'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import CustomFieldInput from './custom-field-input';
import { FileUpload } from './file-upload';
import { ArrowLeft } from 'lucide-react';
import { notifyContactCreated } from '@/app/actions/notify-contact-created';

interface ContactFormProps {
  contact?: any;
  mode?: 'create' | 'edit';
}

export function ContactForm({ contact, mode = 'edit' }: ContactFormProps) {
  const [name, setName] = useState(contact?.name || '');
  const [type, setType] = useState(contact?.type || 'client');
  const [email, setEmail] = useState(contact?.email || '');
  const [phone, setPhone] = useState(contact?.phone || '');
  const [companyName, setCompanyName] = useState(contact?.company_name || '');
  const [website, setWebsite] = useState(contact?.website || '');
  const [facebook, setFacebook] = useState(contact?.facebook || '');
  const [address, setAddress] = useState(contact?.address || '');
  const [status, setStatus] = useState(contact?.status || 'active');
  const [customFields, setCustomFields] = useState(contact?.custom_fields || {});
  const [attachments, setAttachments] = useState<string[]>(contact?.attachments || []);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const data = {
      name,
      type,
      email,
      phone,
      company_name: companyName,
      website,
      facebook,
      address,
      status,
      custom_fields: customFields,
      attachments,
    };

    let error;
    if (contact) {
      const { error: updateError } = await supabase
        .from('contacts')
        .update(data)
        .eq('id', contact.id);
      error = updateError;
    } else {
      const { data: newContact, error: insertError } = await supabase
        .from('contacts')
        .insert([data])
        .select()
        .single();

      if (!insertError && newContact) {
        await notifyContactCreated({
          contactId: newContact.id,
          contactName: newContact.name,
          contactType: newContact.type
        });
      }
      error = insertError;
    }

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(contact ? 'Contact updated' : 'Contact created');
      router.push('/contacts');
      router.refresh();
    }
    setLoading(false);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="flex flex-row items-center gap-4 space-y-0">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <CardTitle>{contact ? 'Edit Contact' : 'New Contact'}</CardTitle>
          <CardDescription>
            {contact ? 'Update contact details.' : 'Add a new contact to your CRM.'}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ... existing form fields ... */}

          {/* I will use a multi-replace or just replace the bottom part to include the buttons */}
          {/* Wait, replace_file_content replaces a chunk. I need to be careful not to delete the middle. */}
          {/* I will split this into two edits or use a larger chunk if I can match it easily. */}
          {/* Actually, I'll just use the provided ReplaceFileContent tool to replace the Header and the Footer separately if possible, or the whole return statement if it's cleaner. */}
          {/* The file is small enough, I can replace the return statement. */}
          {/* But I need to import ArrowLeft first. */}

          {/* Let's do imports first. */}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Type *</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client">Client</SelectItem>
                  <SelectItem value="supplier">Supplier</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                placeholder="https://example.com"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="facebook">Facebook Page</Label>
              <Input
                id="facebook"
                type="url"
                placeholder="https://facebook.com/..."
                value={facebook}
                onChange={(e) => setFacebook(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Attachments</Label>
            <FileUpload
              bucket="attachments"
              existingFiles={attachments}
              onUploadComplete={setAttachments}
            />
          </div>

          <div className="space-y-2">

            <CustomFieldInput
              value={customFields}
              onChange={setCustomFields}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button type="button" variant="outline" className="w-full" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Saving...' : 'Save Contact'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
