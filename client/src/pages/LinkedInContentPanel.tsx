import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Copy, ExternalLink, Calendar, CheckCircle2, Clock, Sparkles, Trash2, Edit } from "lucide-react";

/**
 * LinkedIn Content Panel
 * 
 * Displays AI-generated LinkedIn posts for Juan Carlos Robledo's account.
 * Allows review, edit, copy-to-clipboard, and scheduling.
 */
export default function LinkedInContentPanel() {
  const [selectedTab, setSelectedTab] = useState<"draft" | "scheduled" | "published">("draft");
  const [editingPostId, setEditingPostId] = useState<number | null>(null);
  const [editedContent, setEditedContent] = useState("");

  // Fetch LinkedIn posts
  const { data: posts, isLoading, refetch } = trpc.linkedInPosts.list.useQuery({
    status: selectedTab === "draft" ? "pending" : selectedTab,
    limit: 20,
  });

  // Fetch stats
  const { data: stats } = trpc.linkedInPosts.getStats.useQuery();

  // Generate new post mutation
  const generatePost = trpc.linkedInPosts.generate.useMutation({
    onSuccess: () => {
      toast.success("Post generado exitosamente");
      refetch();
    },
    onError: (error) => {
      toast.error(`Error al generar post: ${error.message}`);
    },
  });

  // Update post mutation
  const updatePost = trpc.linkedInPosts.update.useMutation({
    onSuccess: () => {
      toast.success("Post actualizado");
      setEditingPostId(null);
      refetch();
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  // Delete post mutation
  const deletePost = trpc.linkedInPosts.delete.useMutation({
    onSuccess: () => {
      toast.success("Post eliminado");
      refetch();
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  // Publish to LinkedIn mutation
  const publishPost = trpc.linkedInPosts.publish.useMutation({
    onSuccess: (result) => {
      toast.success("Post publicado en LinkedIn");
      if (result.postUrl) {
        window.open(result.postUrl, "_blank");
      }
      refetch();
    },
    onError: (error) => {
      toast.error(`Error al publicar: ${error.message}`);
    },
  });

  // Mark as published mutation
  const markAsPublished = trpc.linkedInPosts.update.useMutation({
    onSuccess: () => {
      toast.success("Post marcado como publicado");
      refetch();
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const handleCopyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success("Post copiado al portapapeles");
  };

  const handleEdit = (postId: number, content: string) => {
    setEditingPostId(postId);
    setEditedContent(content);
  };

  const handleSaveEdit = (postId: number) => {
    updatePost.mutate({
      id: postId,
      content: editedContent,
    });
  };

  const handleGeneratePost = (postType: "thought_leadership" | "case_study" | "product_update" | "industry_insight" | "customer_success") => {
    generatePost.mutate({
      postType,
      tone: "professional",
    });
  };

  const getPostTypeLabel = (postType: string) => {
    const labels: Record<string, string> = {
      thought_leadership: "Liderazgo de Pensamiento",
      case_study: "Caso de Estudio",
      product_update: "Actualización de Producto",
      industry_insight: "Insights de Industria",
      customer_success: "Caso de Éxito",
    };
    return labels[postType] || postType;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      pending: "secondary",
      scheduled: "outline",
      published: "default",
    };
    const colors: Record<string, string> = {
      pending: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
      scheduled: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
      published: "bg-green-500/10 text-green-700 dark:text-green-400",
    };
    return (
      <Badge variant={variants[status] || "default"} className={colors[status]}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Cargando posts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">LinkedIn Content Panel</h1>
          <p className="text-muted-foreground mt-2">
            Posts generados por agentes de IA para{" "}
            <a
              href="https://www.linkedin.com/in/juan-carlos-robledo-5946a2392/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline inline-flex items-center gap-1"
            >
              Juan Carlos Robledo
              <ExternalLink className="h-3 w-3" />
            </a>
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Posts</CardDescription>
              <CardTitle className="text-3xl">{stats.total}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Pendientes</CardDescription>
              <CardTitle className="text-3xl text-yellow-600">{stats.pending}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Programados</CardDescription>
              <CardTitle className="text-3xl text-blue-600">{stats.scheduled}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Publicados</CardDescription>
              <CardTitle className="text-3xl text-green-600">{stats.published}</CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as typeof selectedTab)}>
        <TabsList>
          <TabsTrigger value="draft">
            <Clock className="h-4 w-4 mr-2" />
            Pendientes ({stats?.pending || 0})
          </TabsTrigger>
          <TabsTrigger value="scheduled">
            <Calendar className="h-4 w-4 mr-2" />
            Programados ({stats?.scheduled || 0})
          </TabsTrigger>
          <TabsTrigger value="published">
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Publicados ({stats?.published || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="mt-6">
          {!posts || posts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  No hay posts en esta categoría. Genera uno nuevo para comenzar.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {posts.map((post) => (
                <Card key={post.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {getPostTypeLabel(post.postType)}
                        </CardTitle>
                        <CardDescription>
                          Generado el {new Date(post.createdAt).toLocaleDateString("es-ES")} por{" "}
                          {post.agentName}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(post.status)}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    {editingPostId === post.id ? (
                      <Textarea
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        rows={12}
                        className="font-mono text-sm"
                      />
                    ) : (
                      <div className="bg-muted p-4 rounded-lg">
                        <pre className="whitespace-pre-wrap text-sm font-sans">{post.content}</pre>
                      </div>
                    )}

                    {post.scheduledFor && (
                      <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        Programado para: {new Date(post.scheduledFor).toLocaleString("es-ES")}
                      </div>
                    )}

                    {post.linkedinUrl && (
                      <div className="mt-4">
                        <a
                          href={post.linkedinUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline inline-flex items-center gap-1 text-sm"
                        >
                          Ver en LinkedIn
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                  </CardContent>

                  <CardFooter className="flex justify-between border-t pt-4">
                    <div className="flex gap-2">
                      {editingPostId === post.id ? (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleSaveEdit(post.id)}
                            disabled={updatePost.isPending}
                          >
                            Guardar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingPostId(null)}
                          >
                            Cancelar
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(post.id, post.content)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCopyToClipboard(post.content)}
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Copiar
                          </Button>
                        </>
                      )}
                    </div>

                    <div className="flex gap-2">
                      {post.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => publishPost.mutate({ postId: post.id })}
                            disabled={publishPost.isPending}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Publicar Ahora
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              markAsPublished.mutate({
                                id: post.id,
                                status: "published",
                              })
                            }
                            disabled={markAsPublished.isPending}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Marcar Publicado
                          </Button>
                        </>
                      )}

                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          if (confirm("¿Estás seguro de eliminar este post?")) {
                            deletePost.mutate({ id: post.id });
                          }
                        }}
                        disabled={deletePost.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Generar Nuevo Post</CardTitle>
          <CardDescription>
            Selecciona el tipo de post que quieres que los agentes generen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { type: "thought_leadership" as const, label: "Liderazgo", icon: "💡" },
              { type: "case_study" as const, label: "Caso de Estudio", icon: "📊" },
              { type: "product_update" as const, label: "Producto", icon: "🚀" },
              { type: "industry_insight" as const, label: "Insights", icon: "📈" },
              { type: "customer_success" as const, label: "Éxito Cliente", icon: "🎉" },
            ].map((postType) => (
              <Button
                key={postType.type}
                variant="outline"
                className="h-auto flex-col py-4"
                onClick={() => handleGeneratePost(postType.type)}
                disabled={generatePost.isPending}
              >
                <span className="text-2xl mb-2">{postType.icon}</span>
                <span className="text-sm">{postType.label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
