'use client'
import { useContact } from '@/hooks/useContact';

export default function ContactName({contactId}: {contactId: string}) {
   const {data: contact, isLoading, isError, error} = useContact(contactId) ;

   console.log('ContactName: ', {contactId, contact, isLoading, isError, error});
   if (isLoading) return <span className="text-muted small">Loading</span>;
   if (!contact) return <span className="text-muted small">Unknown</span>;

   return <strong>{contact?.fullName}</strong>;
}



