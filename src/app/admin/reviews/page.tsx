
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirebase, useCollection } from '@/firebase';
import { collection, addDoc, doc, setDoc, deleteDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader, Plus, Trash2, Edit, Save, History, X, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface PastWork {
  id: string;
  title: string;
  description: string;
  completionDate: string;
  imageUrls: string[];
  createdAt: any;
}

const ADMIN_EMAIL = 'iunlockapple01@gmail.com';

export default function AdminReviewsPage() {
  const { data: user, loading: userLoading } = useUser();
  const { firestore } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();

  const constraints = useMemo(() => [orderBy('completionDate', 'desc')], []);
  const { data: reviews, loading: reviewsLoading } = useCollection<PastWork>('past_work', { constraints });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [completionDate, setCompletionDate] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>(['']);

  const isAdmin = user?.email === ADMIN_EMAIL;

  useEffect(() => {
    if (userLoading) return;
    if (!user || !isAdmin) router.push('/');
  }, [user, userLoading, isAdmin, router]);

  const handleAddImageUrl = () => {
    if (imageUrls.length < 9) setImageUrls([...imageUrls, '']);
  };

  const handleImageUrlChange = (index: number, value: string) => {
    const newUrls = [...imageUrls];
    newUrls[index] = value;
    setImageUrls(newUrls);
  };

  const handleRemoveImageUrl = (index: number) => {
    setImageUrls(imageUrls.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCompletionDate('');
    setImageUrls(['']);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const filteredUrls = imageUrls.filter(url => url.trim() !== '');
    if (!title || !description || !completionDate || filteredUrls.length === 0) {
      return toast({ title: "Validation Error", description: "Please fill all required fields and add at least 1 image.", variant: "destructive" });
    }

    setIsSubmitting(true);
    const workData = {
      title: title.trim(),
      description: description.trim(),
      completionDate,
      imageUrls: filteredUrls,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp()
    };

    if (editingId) {
      const workRef = doc(firestore, 'past_work', editingId);
      setDoc(workRef, workData, { merge: true })
        .then(() => {
          toast({ title: "Entry Updated" });
          resetForm();
        })
        .catch(async (err) => {
          const permissionError = new FirestorePermissionError({ path: workRef.path, operation: 'update', requestResourceData: workData });
          errorEmitter.emit('permission-error', permissionError);
        })
        .finally(() => setIsSubmitting(false));
    } else {
      addDoc(collection(firestore, 'past_work'), workData)
        .then(() => {
          toast({ title: "Entry Published" });
          resetForm();
        })
        .catch(async (err) => {
          const permissionError = new FirestorePermissionError({ path: 'past_work', operation: 'create', requestResourceData: workData });
          errorEmitter.emit('permission-error', permissionError);
        })
        .finally(() => setIsSubmitting(false));
    }
  };

  const handleEdit = (work: PastWork) => {
    setEditingId(work.id);
    setTitle(work.title);
    setDescription(work.description);
    setCompletionDate(work.completionDate);
    setImageUrls(work.imageUrls.length > 0 ? work.imageUrls : ['']);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Are you sure you want to delete this showcase entry?")) return;
    deleteDoc(doc(firestore, 'past_work', id))
      .then(() => toast({ title: "Entry Deleted" }))
      .catch(async () => {
        const permissionError = new FirestorePermissionError({ path: `past_work/${id}`, operation: 'delete' });
        errorEmitter.emit('permission-error', permissionError);
      });
  };

  if (userLoading || !user || !isAdmin) return <div className="flex justify-center items-center h-screen">Loading...</div>;

  return (
    <div className="bg-background min-h-screen pb-20">
      <nav className="glass-effect fixed w-full top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2"><Image src="https://i.postimg.cc/9MCd4HJx/icloud-unlocks-logo.png" alt="iCloud Unlocks Logo" width={90} height={24} /></Link>
            <Link href="/admin" className="text-sm font-medium hover:text-primary transition-colors">Admin Dashboard</Link>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto pt-24 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/admin"><Button variant="outline" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
          <h1 className="text-3xl font-bold">Manage Reviews & Past Work</h1>
        </div>

        <Card className="mb-12 border-border shadow-xl">
          <CardHeader className="bg-muted/30 border-b">
            <CardTitle className="flex items-center gap-2">
              {editingId ? <Edit className="h-5 w-5 text-primary" /> : <Plus className="h-5 w-5 text-primary" />}
              {editingId ? "Edit Showcase Entry" : "Add New Showcase Entry"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Service Title</Label>
                  <Input placeholder="e.g., iPhone 15 Pro Max Unlock Successful" value={title} onChange={(e) => setTitle(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Completion Date</Label>
                  <Input type="date" value={completionDate} onChange={(e) => setCompletionDate(e.target.value)} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Short Description / Review Text</Label>
                <Textarea placeholder="Describe the service provided or paste customer review..." className="min-h-[100px]" value={description} onChange={(e) => setDescription(e.target.value)} required />
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2"><ImageIcon className="h-4 w-4" /> Showcase Images (Max 9)</Label>
                    {imageUrls.length < 9 && <Button type="button" variant="ghost" size="sm" onClick={handleAddImageUrl} className="text-xs text-primary font-bold">+ Add Image URL</Button>}
                </div>
                <div className="grid gap-3">
                  {imageUrls.map((url, index) => (
                    <div key={index} className="flex gap-2">
                      <Input placeholder="Paste image URL here..." value={url} onChange={(e) => handleImageUrlChange(index, e.target.value)} required={index === 0} />
                      {imageUrls.length > 1 && (
                        <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveImageUrl(index)} className="text-red-500"><X className="h-4 w-4" /></Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-4">
                <Button type="submit" className="flex-1 btn-primary text-white font-bold h-12" disabled={isSubmitting}>
                  {isSubmitting ? <Loader className="animate-spin h-5 w-5" /> : (editingId ? "Save Changes" : "Publish Entry")}
                </Button>
                {editingId && <Button type="button" variant="outline" className="h-12" onClick={resetForm}>Cancel</Button>}
              </div>
            </form>
          </CardContent>
        </Card>

        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><History className="h-6 w-6 text-primary" /> Existing Work Showcase</h2>
        
        <div className="space-y-4">
          {reviewsLoading ? (
            <div className="p-12 text-center text-muted-foreground"><Loader className="animate-spin h-8 w-8 mx-auto mb-2" />Loading entries...</div>
          ) : reviews && reviews.length > 0 ? (
            reviews.map((work) => (
              <Card key={work.id} className="border-border hover:shadow-md transition-all overflow-hidden">
                <div className="flex flex-col sm:flex-row">
                  <div className="relative w-full sm:w-48 h-32 flex-shrink-0 bg-muted">
                    <Image src={work.imageUrls[0]} alt="Thumbnail" fill style={{ objectFit: 'cover' }} />
                    {work.imageUrls.length > 1 && (
                        <div className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded font-bold">+{work.imageUrls.length - 1}</div>
                    )}
                  </div>
                  <div className="flex-1 p-4 flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-start">
                            <h3 className="font-bold text-lg leading-tight">{work.title}</h3>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase">{format(new Date(work.completionDate), 'MMM dd, yyyy')}</span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{work.description}</p>
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(work)} className="h-8 text-xs gap-1"><Edit className="h-3 w-3" /> Edit</Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(work.id)} className="h-8 text-xs gap-1 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"><Trash2 className="h-3 w-3" /> Delete</Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <div className="p-20 text-center text-muted-foreground border-2 border-dashed rounded-xl">No showcased work yet.</div>
          )}
        </div>
      </main>
    </div>
  );
}
