'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  MessageSquare, 
  Users, 
  Heart, 
  Eye, 
  Search,
  Plus,
  Pin,
  Lock,
  User,
  Anonymous,
  TrendingUp,
  Clock
} from 'lucide-react'
import { toast } from 'sonner'

interface ForumPost {
  id: string
  title: string
  content: string
  category: string
  isAnonymous: boolean
  isPinned: boolean
  isLocked: boolean
  author?: {
    id: string
    name: string
    avatar?: string
  }
  replyCount: number
  viewCount: number
  likeCount: number
  tags: string[]
  createdAt: string
  updatedAt: string
}

const FORUM_CATEGORIES = [
  { value: 'GENERAL', label: 'General Discussion', color: 'bg-gray-100 text-gray-800' },
  { value: 'ANXIETY', label: 'Anxiety Support', color: 'bg-blue-100 text-blue-800' },
  { value: 'DEPRESSION', label: 'Depression Support', color: 'bg-purple-100 text-purple-800' },
  { value: 'RELATIONSHIPS', label: 'Relationships', color: 'bg-pink-100 text-pink-800' },
  { value: 'TRAUMA', label: 'Trauma & PTSD', color: 'bg-red-100 text-red-800' },
  { value: 'RECOVERY', label: 'Recovery Journey', color: 'bg-green-100 text-green-800' },
  { value: 'SELF_CARE', label: 'Self-Care', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'MINDFULNESS', label: 'Mindfulness', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'SUCCESS_STORIES', label: 'Success Stories', color: 'bg-emerald-100 text-emerald-800' }
]

export default function CommunityForums({ userId }: { userId: string }) {
  const [posts, setPosts] = useState<ForumPost[]>([])
  const [loading, setLoading] = useState(false)
  const [showNewPostDialog, setShowNewPostDialog] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('latest')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    category: 'GENERAL',
    isAnonymous: true,
    tags: [] as string[]
  })

  useEffect(() => {
    fetchPosts()
  }, [selectedCategory, searchTerm, sortBy, currentPage])

  const fetchPosts = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        sortBy
      })

      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory)
      }

      if (searchTerm) {
        params.append('search', searchTerm)
      }

      const response = await fetch(`/api/community/forums?${params}`)
      const data = await response.json()

      if (data.posts) {
        setPosts(data.posts)
        setTotalPages(data.pagination.totalPages)
      }
    } catch (error) {
      console.error('Error fetching forum posts:', error)
      toast.error('Failed to load forum posts')
    } finally {
      setLoading(false)
    }
  }

  const createPost = async () => {
    if (!newPost.title.trim() || !newPost.content.trim()) {
      toast.error('Please fill in both title and content')
      return
    }

    try {
      const response = await fetch('/api/community/forums', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newPost,
          authorId: userId
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Post created successfully')
        setShowNewPostDialog(false)
        setNewPost({
          title: '',
          content: '',
          category: 'GENERAL',
          isAnonymous: true,
          tags: []
        })
        fetchPosts()
      } else {
        toast.error(data.error || 'Failed to create post')
      }
    } catch (error) {
      console.error('Create post error:', error)
      toast.error('Failed to create post')
    }
  }

  const getCategoryColor = (category: string) => {
    const cat = FORUM_CATEGORIES.find(c => c.value === category)
    return cat ? cat.color : 'bg-gray-100 text-gray-800'
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="h-6 w-6" />
            Community Forums
          </h2>
          <p className="text-muted-foreground">
            Anonymous peer support and shared experiences
          </p>
        </div>
        
        <Dialog open={showNewPostDialog} onOpenChange={setShowNewPostDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Post
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Post</DialogTitle>
              <DialogDescription>
                Share your thoughts with the community. You can post anonymously.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={newPost.title}
                  onChange={(e) => setNewPost(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Give your post a title..."
                />
              </div>

              <div>
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={newPost.category}
                  onValueChange={(value) => setNewPost(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FORUM_CATEGORIES.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="content">Content *</Label>
                <Textarea
                  id="content"
                  value={newPost.content}
                  onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Share your thoughts, experiences, or questions..."
                  rows={6}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="anonymous"
                  checked={newPost.isAnonymous}
                  onCheckedChange={(checked) => setNewPost(prev => ({ ...prev, isAnonymous: checked }))}
                />
                <Label htmlFor="anonymous">Post anonymously</Label>
              </div>

              <div className="flex gap-2">
                <Button onClick={createPost} className="flex-1">
                  Create Post
                </Button>
                <Button variant="outline" onClick={() => setShowNewPostDialog(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search posts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {FORUM_CATEGORIES.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="latest">Latest</SelectItem>
                  <SelectItem value="popular">Popular</SelectItem>
                  <SelectItem value="most_replies">Most Replies</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Posts List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : posts.length === 0 ? (
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <MessageSquare className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">No posts found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || selectedCategory !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'Be the first to share in this community'
                }
              </p>
              {!searchTerm && selectedCategory === 'all' && (
                <Button onClick={() => setShowNewPostDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Post
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          posts.map((post) => (
            <Card key={post.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {post.isPinned && <Pin className="h-4 w-4 text-red-500" />}
                    {post.isLocked && <Lock className="h-4 w-4 text-orange-500" />}
                    <Badge className={getCategoryColor(post.category)}>
                      {FORUM_CATEGORIES.find(c => c.value === post.category)?.label}
                    </Badge>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {formatTimeAgo(post.createdAt)}
                  </span>
                </div>

                <h3 className="text-lg font-semibold mb-2 hover:text-primary cursor-pointer">
                  {post.title}
                </h3>

                <p className="text-muted-foreground mb-4 line-clamp-2">
                  {post.content}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      {post.isAnonymous ? (
                        <>
                          <Anonymous className="h-4 w-4" />
                          <span>Anonymous</span>
                        </>
                      ) : (
                        <>
                          <User className="h-4 w-4" />
                          <span>{post.author?.name}</span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageSquare className="h-4 w-4" />
                      <span>{post.replyCount}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      <span>{post.viewCount}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Heart className="h-4 w-4" />
                      <span>{post.likeCount}</span>
                    </div>
                  </div>

                  {post.tags.length > 0 && (
                    <div className="flex gap-1">
                      {post.tags.slice(0, 2).map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {post.tags.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{post.tags.length - 2}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = i + 1
              return (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </Button>
              )
            })}
          </div>

          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}