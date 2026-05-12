import type { APIRoute } from 'astro';
import { getSession } from '@/lib/auth/session-adapter';
import { projectRepository } from '@/lib/db/repositories';
import { getJob, getJobState } from '@/lib/queue';

export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    const session = await getSession(request, cookies);
    if (!session?.user?.id) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(request.url);
    const projectId = url.searchParams.get('projectId');

    if (!projectId) {
      return new Response(
        JSON.stringify({ error: 'Project ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get project
    const project = await projectRepository.findById(projectId);

    if (!project) {
      return new Response(
        JSON.stringify({ error: 'Project not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const videoProject = project as any;

    // Calculate progress based on completed scenes
    let progress = 0;
    if (videoProject.videoStatus === 'completed') {
      progress = 100;
    } else if (videoProject.videoStatus === 'generating' || videoProject.videoStatus === 'rendering') {
      const total = videoProject.totalScenes || 1;
      const completed = videoProject.completedScenes || 0;
      progress = Math.round((completed / total) * 100);
    }

    return new Response(
      JSON.stringify({
        projectId: project.id,
        videoStatus: videoProject.videoStatus || 'draft',
        progress,
        totalScenes: videoProject.totalScenes || 0,
        completedScenes: videoProject.completedScenes || 0,
        outputVideoUrl: videoProject.outputVideoUrl,
        thumbnailUrl: videoProject.thumbnailUrl,
        estimatedDuration: videoProject.estimatedDuration,
        errorMessage: videoProject.errorMessage,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Video AI] Status error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to get status',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
