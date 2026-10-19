import { useQuery } from "@tanstack/react-query";
import {useSession} from "next-auth/react";
import { getContact } from "@/libs/api";
import type { ContactDetail } from "@/types/contact";

export function useContact(contactId: string) {
    const { data: session } = useSession();
    return useQuery<ContactDetail>({
        queryKey: ['contact', contactId],
        queryFn: () => getContact(contactId, session?.user?.accessToken),
        enabled: !!contactId,
        staleTime: 5 * 60 * 1000,

    });
}