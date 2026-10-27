"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Play, Download, Trash2, Clock, CheckCircle, AlertCircle, Loader2, X } from "lucide-react";
import type { ProjectData } from "@/lib/store/projects";
import type { Storyboard } from "@/types";

function getStatusIcon(status: string) {
  switch (status) {
    case "completed":
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case "processing":
      return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
    case "failed":
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    default:
      return <Clock className="h-4 w-4 text-gray-400" />;
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case "completed":
      return <Badge variant="default" className="bg-green-500">Completed</Badge>;
    case "processing":
      return <Badge variant="default" className="bg-blue-500">Processing</Badge>;
    case "failed":
      return <Badge variant="destructive">Failed</Badge>;
    default:
      return <Badge variant="secondary">Draft</Badge>;
  }
}

export function Dashboard() {
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [activeTab, setActiveTab] = useState("projects");

  // Form state
  const [projectName, setProjectName] = useState("");
  const [topic, setTopic] = useState("");
  const [selectedDuration, setSelectedDuration] = useState(60);

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generatedScript, setGeneratedScript] = useState<string | null>(null);
  const [generatedStoryboard, setGeneratedStoryboard] = useState<Storyboard | null>(null);

  // Provider health state
  const [providerHealth, setProviderHealth] = useState<any>(null);

  // Video player modal state
  const [selectedProject, setSelectedProject] = useState<ProjectData | null>(null);
  const [showVideoModal, setShowVideoModal] = useState(false);

  // Load projects on mount
  useEffect(() => {
    loadProjects();
    loadProviderHealth();
  }, []);

  async function loadProjects() {
    try {
      const response = await fetch("/api/projects");
      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects || []);
      }
    } catch (error) {
      console.error("Failed to load projects:", error);
    } finally {
      setIsLoadingProjects(false);
    }
  }

  async function loadProviderHealth() {
    try {
      const response = await fetch("/api/health");
      if (response.ok) {
        const data = await response.json();
        setProviderHealth(data);
      }
    } catch (error) {
      console.error("Failed to load provider health:", error);
    }
  }

  async function handleGenerate() {
    if (!projectName.trim() || !topic.trim()) {
      setGenerationError("Please fill in both project name and topic");
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);
    setGeneratedScript(null);
    setGeneratedStoryboard(null);

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: projectName,
          topic,
          duration: selectedDuration,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate video");
      }

      const data = await response.json();
      setGeneratedScript(data.script);
      setGeneratedStoryboard(data.storyboard);

      // Reload projects list
      await loadProjects();

      // Reset form
      setProjectName("");
      setTopic("");
      setSelectedDuration(60);

      // If video was generated, show it immediately
      if (data.videoUrl && data.project) {
        setSelectedProject(data.project);
        setShowVideoModal(true);
      }

      // Switch to projects tab to show the result
      setTimeout(() => setActiveTab("projects"), 1000);

    } catch (error) {
      setGenerationError(error instanceof Error ? error.message : "Unknown error occurred");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Creator Engine</h1>
          <p className="text-muted-foreground">AI-powered video creation</p>
        </div>
        <Button onClick={() => setActiveTab("create")}>
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="create">Create Video</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="space-y-4">
          {isLoadingProjects ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : projects.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground mb-4">No projects yet</p>
                <Button onClick={() => setActiveTab("create")}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create your first video
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <Card key={project.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{project.name}</CardTitle>
                      {getStatusBadge(project.status)}
                    </div>
                    <CardDescription className="line-clamp-2">{project.topic}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {project.storyboard && (
                        <div className="text-sm text-muted-foreground">
                          <p>{project.storyboard.scenes.length} scenes • {project.storyboard.metadata.totalDuration}s</p>
                        </div>
                      )}
                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            setSelectedProject(project);
                            setShowVideoModal(true);
                          }}
                        >
                          <Play className="mr-1 h-3 w-3" />
                          {project.status === "completed" ? "View" : "Details"}
                        </Button>
                        {project.status === "completed" && project.videoUrl && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const link = document.createElement("a");
                              link.href = project.videoUrl!;
                              link.download = `${project.name}.mp4`;
                              link.click();
                            }}
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                        )}
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle>Create New Video</CardTitle>
              <CardDescription>
                Enter a topic and AI will generate a complete video script and storyboard
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Project Name</label>
                <Input
                  placeholder="My Video Project"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  disabled={isGenerating}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Video Topic</label>
                <Textarea
                  placeholder="What should your video be about? e.g., The benefits of daily exercise..."
                  rows={4}
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  disabled={isGenerating}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Video Duration</label>
                <div className="flex gap-4">
                  <Button
                    variant={selectedDuration === 30 ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => setSelectedDuration(30)}
                    disabled={isGenerating}
                  >
                    30s
                  </Button>
                  <Button
                    variant={selectedDuration === 60 ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => setSelectedDuration(60)}
                    disabled={isGenerating}
                  >
                    60s
                  </Button>
                  <Button
                    variant={selectedDuration === 90 ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => setSelectedDuration(90)}
                    disabled={isGenerating}
                  >
                    90s
                  </Button>
                </div>
              </div>

              {generationError && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm text-destructive">{generationError}</p>
                </div>
              )}

              {generatedScript && generatedStoryboard && (
                <div className="space-y-4 border-t pt-4">
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Generation Complete!
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Script and storyboard generated. Check the Projects tab to view details.
                    </p>
                  </div>
                </div>
              )}

              <Button
                className="w-full"
                size="lg"
                onClick={handleGenerate}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Generate Video
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
              <CardDescription>
                Configure your AI providers and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border rounded-lg bg-muted/50">
                <h4 className="font-medium mb-2">Provider Configuration</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Configure your AI, TTS, and asset providers in environment variables.
                  See .env.example for required keys.
                </p>
              </div>
              <div className="p-4 border rounded-lg bg-muted/50">
                <h4 className="font-medium mb-2">Pipeline Status</h4>
                {providerHealth ? (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>LLM ({providerHealth.providers.llm.name})</span>
                      <Badge variant={providerHealth.providers.llm.available ? "default" : "secondary"}>
                        {providerHealth.providers.llm.available ? "Configured" : "Not configured"}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>TTS ({providerHealth.providers.tts.name})</span>
                      <Badge variant="secondary">Not configured</Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Assets ({providerHealth.providers.assets.name})</span>
                      <Badge variant="secondary">Not configured</Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Renderer ({providerHealth.providers.renderer.name})</span>
                      <Badge variant="secondary">Not configured</Badge>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Video Player Modal */}
      {showVideoModal && selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="relative w-full max-w-4xl mx-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{selectedProject.name}</CardTitle>
                    <CardDescription>{selectedProject.topic}</CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowVideoModal(false);
                      setSelectedProject(null);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedProject.videoUrl ? (
                  <div className="space-y-4">
                    <video
                      controls
                      className="w-full max-h-[70vh] bg-black rounded-lg"
                      src={selectedProject.videoUrl}
                    >
                      Your browser does not support the video tag.
                    </video>
                    <div className="flex gap-2">
                      <Button
                        className="flex-1"
                        onClick={() => {
                          const link = document.createElement("a");
                          link.href = selectedProject.videoUrl!;
                          link.download = `${selectedProject.name}.mp4`;
                          link.click();
                        }}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download Video
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <p className="text-muted-foreground">Video not yet rendered</p>
                  </div>
                )}

                {selectedProject.storyboard && (
                  <div className="space-y-2">
                    <h3 className="font-medium">Storyboard</h3>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {selectedProject.storyboard.scenes.map((scene, idx) => (
                        <div key={scene.id} className="p-3 border rounded-lg text-sm">
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-medium">Scene {idx + 1}</span>
                            <div className="flex gap-2">
                              <Badge variant="secondary">{scene.visualType}</Badge>
                              <span className="text-muted-foreground">{scene.duration}s</span>
                            </div>
                          </div>
                          <p className="text-muted-foreground">{scene.narrationText}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
