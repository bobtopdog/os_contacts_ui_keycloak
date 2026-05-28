import TeamPage from '@/components/TeamPage';

interface Props {
  params: Promise<{ teamId: string }>;
}

export default async function TeamsPage({ params }: Props) {
  const { teamId } = await params;
  return (
    <div className="row justify-content-center">
      <div className="col-12 ">
        <TeamPage teamId={teamId} />
      </div>
    </div>
    
  );
}
