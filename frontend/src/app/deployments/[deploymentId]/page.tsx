type Props = {
  params: Promise<{
    deploymentId: string;
  }>;
};

export default async function DeploymentDetailPage({ params }: Props) {
  const { deploymentId } = await params;

  return (
    <div className="p-8 text-white">
      <h1 className="text-3xl font-semibold">Deployment Route Works</h1>
      <p className="mt-2 text-neutral-400">
        Deployment ID: {deploymentId}
      </p>
    </div>
  );
}