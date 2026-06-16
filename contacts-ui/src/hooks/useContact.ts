import { useQuery } from "@tanstack/react-query";
import { getContact } from "@/libs/api";
import type { ContactDetail } from "@/types/contact";

export function useContact(contactId: string) {
    return useQuery<ContactDetail>({
        queryKey: ['contact', contactId],
        queryFn: () => getContact(contactId),
        enabled: !!contactId,
        staleTime: 5 * 60 * 1000,

    });
}