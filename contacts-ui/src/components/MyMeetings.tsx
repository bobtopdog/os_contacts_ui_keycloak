'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMyMeetings } from '@/libs/api';
import { getContact } from '@/libs/api';
import type { MyContactMeeting } from '@/types/contact';
import ContactName from './ContactName';
import Link from 'next/link';
import { useRouter } from 'next/navigation';


interface Props {
    userName: string;
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function NoteCard({
    note,
    currentUsername,

}: {
    note: MyContactMeeting;
    currentUsername: string;

}) {
    const isOwner = note.username === currentUsername;
    const [isEditing, setIsEditing] = useState(false);
   
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [error, setError] = useState('');

    const router = useRouter();

    function handleClick(e: React.MouseEvent) {
        e.preventDefault();

        // Close the offcanvas first
        const offcanvasEl = document.getElementById('offcanvasExample');
        if (offcanvasEl && typeof window !== 'undefined') {
            // @ts-expect-error - bootstrap is loaded globally
            const offcanvas = window.bootstrap?.Offcanvas?.getInstance(offcanvasEl);
            offcanvas?.hide();
        }

        // Then navigate data-bs-dismiss="offcanvas"
        router.push(`/contacts/${note.contactId}`);
    }

    return (
        <div className={`card border-0 mb-3 ${isOwner ? 'bg-primary bg-opacity-10' : 'bg-light'}`}>
            <div className="card-body py-2 px-3">

                {/* View mode */}
                {isOwner && (
                    <>
                        <a
                            href={`/contacts/${note.contactId}`}
                            onClick={handleClick}
                            className="text-decoration-none " data-bs-dismiss="offcanvas"
                        >
                            📇 <ContactName contactId={note.contactId} />
                        </a>

                        <p className="mb-1" style={{ whiteSpace: 'pre-wrap' }}>Meeting on: {note.meetingDate}</p>
                        <p className="mb-1" style={{ whiteSpace: 'pre-wrap' }}>{note.notes}</p>
                        <div className="d-flex justify-content-between align-items-center mt-1">

                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default function ContactMeetings({ userName }: Props) {
    const { data: session, status } = useSession();
    const queryClient = useQueryClient();
    const [comment, setComment] = useState('');
    const [saveError, setSaveError] = useState('');

    const username = session?.user?.username ?? '';

    const { data: meetings, isLoading, isError } = useQuery<MyContactMeeting[]>({
        queryKey: ['meetings', userName],
        queryFn: () => getMyMeetings(userName),
    });
    return (
        <div className="mt-1">
            {status === 'authenticated' ? (
                <div >

                </div>
            ) : (
                <div className="alert alert-info py-2 small mb-4">Please sign in to add notes.</div>
            )}

            {isLoading && (
                <div className="text-center text-muted py-3">
                    <span className="spinner-border spinner-border-sm me-2" />Loading notes…
                </div>
            )}

            {isError && (
                <div className="alert alert-warning py-2 small">Could not load notes. Please try refreshing.</div>
            )}

            {meetings && meetings.length === 0 && (
                <p className="text-muted small">No meetings yet for this contact.</p>
            )}

            {meetings && meetings.length > 0 && (
                <div>
                    {meetings.map((note) => (
                        <div key={note.meetingId}>

                            <NoteCard
                                key={note.meetingId}
                                note={note}
                                currentUsername={username}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
