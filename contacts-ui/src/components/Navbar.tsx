'use client';

import Link from 'next/link';
import { useSession, signIn, signOut } from 'next-auth/react';
import ProfilePanel from '@/components/ProfilePanel';
import TeamButtons from '@/components/TeamButtons';
import TagButtons from '@/components/TagButtons';
export default function Navbar() {
  const { data: session, status } = useSession();

  return (<>
    <div className="offcanvas offcanvas-start" tabIndex={-1} id="offcanvasExample" aria-labelledby="offcanvasExampleLabel">
      <div className="offcanvas-header">
        <h5 className="offcanvas-title" id="offcanvasExampleLabel">My Profile</h5>
        <button type="button" className="btn-close text-reset" data-bs-dismiss="offcanvas" aria-label="Close"></button>
      </div>
      <div className="offcanvas-body">
        <div>

          <ProfilePanel />

        </div>

      </div>
    </div>
    <div className="collapse" id="collapseExample">
      <div className="card card-body">
        <TeamButtons />
      </div>
    </div>
    <div className="collapse" id="collapseTag">
      <div className="card card-body">
        <TagButtons />
      </div>
    </div>
  </>
  );
}
