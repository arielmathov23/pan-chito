import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import Navbar from '../../components/Navbar';
import EmptyState from '../../components/EmptyState';
import { Project, projectStore } from '../../utils/projectStore';
import { PRD, prdStore } from '../../utils/prdStore';

export default function PRDDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [prd, setPrd] = useState<PRD | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      const foundPRD = prdStore.getPRD(id as string);
      setPrd(foundPRD);
      
      if (foundPRD) {
        const foundProject = projectStore.getProject(foundPRD.projectId);
        setProject(foundProject);
      }
      
      setIsLoading(false);
    }
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!prd || !project) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <EmptyState
            title="PRD not found"
            description="The PRD you're looking for doesn't exist"
            icon="prd"
            action={{
              href: "/projects",
              text: "Go to projects"
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-4">
            <Link href="/projects" className="hover:text-foreground transition-colors">Projects</Link>
            <span>/</span>
            <Link href={`/project/${project.id}`} className="hover:text-foreground transition-colors">
              {project.name}
            </Link>
            <span>/</span>
            <span className="text-foreground">{prd.title}</span>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">{prd.title}</h1>
            <p className="text-muted-foreground mt-2">
              Created {new Date(prd.createdAt).toLocaleDateString()}
            </p>
          </div>

          <div className="bg-card rounded-xl border border-border/40 shadow-card p-6">
            <div className="prose prose-gray max-w-none dark:prose-invert">
              <ReactMarkdown>
                {prd.content}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 