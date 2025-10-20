import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Loader2, Download } from "lucide-react";
import { toast } from "sonner";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [generatePrompt, setGeneratePrompt] = useState("");
  const [editPrompt, setEditPrompt] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedImageForEdit, setSelectedImageForEdit] = useState<string | null>(null);

  const generateMutation = trpc.images.generate.useMutation();
  const editMutation = trpc.images.edit.useMutation();
  const listQuery = trpc.images.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const handleGenerate = async () => {
    if (!generatePrompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }

    try {
      const result = await generateMutation.mutateAsync({
        prompt: generatePrompt,
      });
      setGeneratePrompt("");
      toast.success("Image generated successfully!");
      await listQuery.refetch();
    } catch (error) {
      toast.error("Failed to generate image");
    }
  };

  const handleEdit = async () => {
    if (!editImageUrl.trim()) {
      toast.error("Please enter an image URL");
      return;
    }
    if (!editPrompt.trim()) {
      toast.error("Please enter an edit prompt");
      return;
    }

    try {
      const result = await editMutation.mutateAsync({
        imageUrl: editImageUrl,
        prompt: editPrompt,
      });
      setEditImageUrl("");
      setEditPrompt("");
      setSelectedImageForEdit(null);
      toast.success("Image edited successfully!");
      listQuery.refetch();
    } catch (error) {
      toast.error("Failed to edit image");
    }
  };

  const downloadImage = (url: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = `image-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Always show the main interface - no login required
  const displayName = user?.name || "Guest";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              {APP_LOGO && <img src={APP_LOGO} alt="Logo" className="h-10" />}
              <h1 className="text-3xl font-bold text-white">{APP_TITLE}</h1>
            </div>
            <div className="text-white text-sm">
              Welcome, <span className="font-semibold">{displayName}</span>
            </div>
          </div>
          <p className="text-gray-300">Create and edit images with AI-powered tools</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Tools */}
          <div className="lg:col-span-1">
            <Tabs defaultValue="generate" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-slate-800 border border-slate-700">
                <TabsTrigger value="generate" className="text-white">Generate</TabsTrigger>
                <TabsTrigger value="edit" className="text-white">Edit</TabsTrigger>
              </TabsList>

              <TabsContent value="generate" className="mt-6">
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">Generate Image</CardTitle>
                    <CardDescription className="text-gray-400">
                      Describe what you want to create
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Textarea
                      placeholder="e.g., A serene landscape with mountains and a sunset..."
                      value={generatePrompt}
                      onChange={(e) => setGeneratePrompt(e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white placeholder:text-gray-500 min-h-24"
                      disabled={generateMutation.isPending}
                    />
                    <Button
                      onClick={handleGenerate}
                      disabled={generateMutation.isPending || !generatePrompt.trim()}
                      className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                    >
                      {generateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {generateMutation.isPending ? "Generating..." : "Generate Image"}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="edit" className="mt-6">
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">Edit Image</CardTitle>
                    <CardDescription className="text-gray-400">
                      Select an image from your studio
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-white mb-2 block">
                        Select Image
                      </label>
                      {listQuery.data && listQuery.data.length > 0 ? (
                        <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto bg-slate-700 p-2 rounded">
                          {listQuery.data.map((image) => (
                            <div
                              key={image.id}
                              onClick={() => {
                                setSelectedImageForEdit(image.imageUrl);
                                setEditImageUrl(image.imageUrl);
                              }}
                              className={`cursor-pointer rounded overflow-hidden border-2 transition ${
                                selectedImageForEdit === image.imageUrl
                                  ? "border-purple-500"
                                  : "border-slate-600 hover:border-purple-400"
                              }`}
                            >
                              <img
                                src={image.imageUrl}
                                alt="Select"
                                className="w-full h-16 object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-gray-400 text-sm p-4 bg-slate-700 rounded text-center">
                          No images yet. Create one first!
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-medium text-white mb-2 block">
                        Edit Prompt
                      </label>
                      <Textarea
                        placeholder="e.g., Add a rainbow to the sky..."
                        value={editPrompt}
                        onChange={(e) => setEditPrompt(e.target.value)}
                        className="bg-slate-700 border-slate-600 text-white placeholder:text-gray-500 min-h-24"
                        disabled={editMutation.isPending}
                      />
                    </div>
                    <Button
                      onClick={handleEdit}
                      disabled={editMutation.isPending || !editImageUrl.trim() || !editPrompt.trim()}
                      className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                    >
                      {editMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {editMutation.isPending ? "Editing..." : "Edit Image"}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - Gallery */}
          <div className="lg:col-span-2">
            <Card className="bg-slate-800 border-slate-700 h-full">
              <CardHeader>
                <CardTitle className="text-white">Your Images</CardTitle>
                <CardDescription className="text-gray-400">
                  {listQuery.data?.length || 0} images created
                </CardDescription>
              </CardHeader>
              <CardContent>
                {listQuery.isLoading ? (
                  <div className="flex items-center justify-center h-96">
                    <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                  </div>
                ) : listQuery.data && listQuery.data.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                    {listQuery.data.map((image) => (
                      <div
                        key={image.id}
                        className="group relative bg-slate-700 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-purple-500 transition"
                        onClick={() => setSelectedImage(image.imageUrl)}
                      >
                        {image.imageUrl && (
                          <>
                            <img
                              src={image.imageUrl}
                              alt={image.prompt}
                              className="w-full h-40 object-cover"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  downloadImage(image.imageUrl);
                                }}
                                className="text-white hover:bg-slate-600"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          </>
                        )}
                        <div className="p-3 bg-slate-700">
                          <p className="text-sm text-gray-300 line-clamp-2">{image.prompt}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {image.createdAt ? (image.createdAt instanceof Date ? image.createdAt.toLocaleDateString() : new Date(image.createdAt as unknown as string).toLocaleDateString()) : 'N/A'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-96 text-gray-400">
                    <p className="text-lg mb-2">No images yet</p>
                    <p className="text-sm">Create your first image to get started!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Image Preview Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedImage(null)}
        >
          <div className="max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <img src={selectedImage} alt="Preview" className="w-full rounded-lg" />
            <div className="mt-4 flex gap-2 justify-center">
              <Button
                onClick={() => downloadImage(selectedImage)}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
              <Button
                onClick={() => setSelectedImage(null)}
                variant="outline"
                className="text-white border-slate-600 hover:bg-slate-800"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

