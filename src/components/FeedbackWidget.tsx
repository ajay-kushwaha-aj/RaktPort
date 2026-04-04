import React, { useState } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { MessageSquarePlus, Star, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { submitFeedback } from '../lib/feedback';
import { useLocation } from 'react-router-dom';

export function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<'feedback' | 'bug'>('feedback');
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState(0);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const location = useLocation();

  const resetForm = () => {
    setMessage('');
    setRating(0);
    setEmail('');
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setTimeout(resetForm, 200); // Reset after closing animation
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      toast.error('Please enter a message.');
      return;
    }
    if (type === 'feedback' && rating === 0) {
      toast.error('Please select a rating.');
      return;
    }

    setLoading(true);
    const result = await submitFeedback({
      type,
      message,
      rating: type === 'feedback' ? rating : undefined,
      contactEmail: email,
      path: location.pathname,
    });
    setLoading(false);

    if (result.success) {
      toast.success(type === 'feedback' ? 'Thanks for your feedback!' : 'Bug report submitted. We will look into it.');
      setOpen(false);
      resetForm();
    } else {
      toast.error('Failed to submit. Please try again later.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-[0_4px_15px_rgba(139,0,0,0.3)] hover:shadow-xl bg-rp-primary text-white z-[9999] transition-all hover:scale-105 flex items-center justify-center cursor-pointer border-none"
          title="Feedback & Bug Report"
        >
          <MessageSquarePlus className="h-6 w-6" />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-[var(--bg-surface)] dark:bg-gray-900 border-[var(--border-color)] dark:border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-[var(--text-primary)] dark:text-gray-100">Help us improve RaktPort</DialogTitle>
          <DialogDescription className="text-[var(--text-secondary)] dark:text-gray-400">
            Share your thoughts or report an issue you've encountered.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={type} onValueChange={(v: string) => {
            setType(v as 'feedback' | 'bug');
            setMessage('');
        }} className="w-full mt-4">
          <TabsList className="grid w-full grid-cols-2 bg-[var(--bg-page)] dark:bg-gray-800 text-[var(--text-secondary)] dark:text-gray-400 p-1 rounded-lg">
            <TabsTrigger value="feedback">Feedback</TabsTrigger>
            <TabsTrigger value="bug">Bug Report</TabsTrigger>
          </TabsList>
          
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <TabsContent value="feedback" className="space-y-4 mt-0">
              <div className="space-y-2">
                <Label className="text-[var(--text-primary)] dark:text-gray-100">How would you rate your experience?</Label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="focus:outline-none transition-colors p-1"
                    >
                      <Star
                        className={`h-8 w-8 ${
                          star <= rating ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="feedback-msg" className="text-[var(--text-primary)] dark:text-gray-100">Tell us more</Label>
                <Textarea
                  id="feedback-msg"
                  placeholder="What do you like? What could be better?"
                  value={type === 'feedback' ? message : ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                    if (type === 'feedback') setMessage(e.target.value);
                  }}
                  className="bg-[var(--bg-page)] dark:bg-gray-800 border-[var(--border-color)] dark:border-gray-700 text-[var(--text-primary)] dark:text-gray-100 min-h-[100px]"
                />
              </div>
            </TabsContent>
            
            <TabsContent value="bug" className="space-y-4 mt-0">
              <div className="space-y-2">
                <Label htmlFor="bug-msg" className="text-[var(--text-primary)] dark:text-gray-100">Describe the bug</Label>
                <Textarea
                  id="bug-msg"
                  placeholder="What happened? What did you expect to happen?"
                  value={type === 'bug' ? message : ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                    if (type === 'bug') setMessage(e.target.value);
                  }}
                  className="bg-[var(--bg-page)] dark:bg-gray-800 border-[var(--border-color)] dark:border-gray-700 text-[var(--text-primary)] dark:text-gray-100 min-h-[100px]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[var(--text-primary)] dark:text-gray-100">Email (optional)</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="For follow-up questions"
                  value={email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                  className="bg-[var(--bg-page)] dark:bg-gray-800 border-[var(--border-color)] dark:border-gray-700 text-[var(--text-primary)] dark:text-gray-100"
                />
              </div>
            </TabsContent>

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={loading} className="bg-rp-primary hover:bg-rp-primary-dark text-white">
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Submit {type === 'bug' ? 'Report' : 'Feedback'}
              </Button>
            </div>
          </form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
