/* eslint-disable @next/next/no-img-element */
'use client';

import React, { use, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronRight, Calendar, ArrowLeft, Eye, Share2 } from 'lucide-react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import 'highlight.js/styles/github-dark.css';
import './markdown.css';

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function extractTextFromHTML(html: string, maxLength: number = 200): string {
  const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}


function updateMetaTags(title: string, description: string, imageUrl?: string) {
  if (typeof document === 'undefined') return;
  
  const url = window.location.href;
  
  const metaTags = [
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:url', content: url },
    { property: 'og:type', content: 'article' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
  ];
  
  if (imageUrl) {
    metaTags.push(
      { property: 'og:image', content: imageUrl },
      { name: 'twitter:image', content: imageUrl }
    );
  }
  
  metaTags.forEach(({ property, name, content }) => {
    const selector = property ? `meta[property="${property}"]` : `meta[name="${name}"]`;
    let meta = document.querySelector(selector);
    
    if (!meta) {
      meta = document.createElement('meta');
      if (property) meta.setAttribute('property', property);
      if (name) meta.setAttribute('name', name);
      document.head.appendChild(meta);
    }
    
    meta.setAttribute('content', content);
  });
  
  document.title = title;
}

export default function PostDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const post = useQuery(api.posts.getBySlug, { slug });
  const postCategories = useQuery(
    api.postCategories.getPostCategories,
    post?._id ? { postId: post._id } : "skip"
  );
  
  const firstCategoryId = postCategories?.[0]?._id;
  const relatedPostIds = useQuery(
    api.postCategories.getPostsByCategory,
    firstCategoryId ? { categoryId: firstCategoryId } : "skip"
  );
  
  // Filter out current post from related
  const relatedPosts = relatedPostIds?.filter(p => p._id !== post?._id).slice(0, 3);

  const handleShareFacebook = () => {
    if (!post) return;
    
    const url = window.location.href;
    
    // Fallback: Use sharer.php (simpler, no app_id required)
    const fallbackUrl = `https://www.facebook.com/sharer.php?u=${encodeURIComponent(url)}`;
    
    window.open(fallbackUrl, 'facebook-share-dialog', 'width=626,height=436');
    toast.success('Đã mở cửa sổ chia sẻ Facebook');
  };
  
  useEffect(() => {
    if (post) {
      const description = extractTextFromHTML(post.content, 200);
      updateMetaTags(post.title, description, post.imageUrl);
    }
  }, [post]);

  if (post === undefined) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
        <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded" />
        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-full" />
        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-5/6" />
      </div>
    );
  }

  if (post === null || !post.isPublished) {
    return (
      <div className="text-center py-12 px-4">
        <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
          <Eye className="w-10 h-10 text-slate-400" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Không tìm thấy bài viết
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mb-6">
          Bài viết này không tồn tại hoặc đã bị ẩn
        </p>
        <Link
          href="/bai-viet"
          className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors font-medium"
        >
          <ArrowLeft size={20} />
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  const related = relatedPosts || [];

  return (
    <div className="space-y-8">
      <nav className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <Link href="/" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
          Trang chủ
        </Link>
        <ChevronRight size={16} />
        <Link href="/bai-viet" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
          Bài viết
        </Link>
        <ChevronRight size={16} />
        <span className="text-slate-900 dark:text-white font-medium truncate">
          {post.title}
        </span>
      </nav>

      {/* Categories */}
      {postCategories && postCategories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {postCategories.map((cat) => (
            <Link
              key={cat._id}
              href={`/bai-viet`}
              className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 hover:bg-teal-200 dark:hover:bg-teal-900/50 transition-colors"
            >
              {cat.name}
            </Link>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="font-medium">Quay lại</span>
        </button>
        
        <button
          onClick={handleShareFacebook}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <Share2 size={18} />
          <span className="hidden sm:inline">Chia sẻ Facebook</span>
          <span className="sm:hidden">Share</span>
        </button>
      </div>

        <article className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          {post.imageUrl && (
            <div className="relative h-64 sm:h-80 lg:h-96 overflow-hidden bg-slate-100 dark:bg-slate-800">
              <img
                src={post.imageUrl}
                alt={post.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="p-6 sm:p-8 lg:p-12 space-y-6">
            <div className="space-y-4">
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white leading-tight">
                {post.title}
              </h1>
              
              <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(post.createdAt)}</span>
                </div>
              </div>
            </div>

            <div className="h-px bg-slate-200 dark:bg-slate-800" />

            {post.isMarkdown && post.markdownContent ? (
              <div className="markdown-content">
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight, rehypeRaw]}
                >
                  {post.markdownContent}
                </ReactMarkdown>
              </div>
            ) : (
              <div 
                className="prose prose-slate dark:prose-invert max-w-none prose-img:rounded-xl prose-headings:text-slate-900 dark:prose-headings:text-white prose-p:text-slate-700 dark:prose-p:text-slate-300 prose-a:text-teal-600 dark:prose-a:text-teal-400"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />
            )}
          </div>
        </article>

        {related.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Bài viết cùng danh mục
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {postCategories && postCategories.length > 0 && `Danh mục: ${postCategories[0].name}`}
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {related.map((relatedPost) => (
                <Link
                  key={relatedPost._id}
                  href={`/bai-viet/${relatedPost.slug}`}
                  className="group bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-lg hover:border-teal-500 dark:hover:border-teal-500 transition-all duration-300"
                >
                  {relatedPost.imageUrl ? (
                    <div className="relative h-32 overflow-hidden bg-slate-100 dark:bg-slate-800">
                      <img
                        src={relatedPost.imageUrl}
                        alt={relatedPost.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ) : (
                    <div className="h-32 bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center">
                      <Eye className="w-8 h-8 text-white/50" />
                    </div>
                  )}
                  
                  <div className="p-4">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors line-clamp-2">
                      {relatedPost.title}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
  );
}
