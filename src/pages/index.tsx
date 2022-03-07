import { FiCalendar, FiUser } from 'react-icons/fi';
import { GetStaticProps } from 'next';
import { format } from 'date-fns';
import { useState } from 'react';

import ptBR from 'date-fns/locale/pt-BR';
import Prismic from '@prismicio/client';
import Link from 'next/link';

import { getPrismicClient } from '../services/prismic';
import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps) {
  const [posts, setPosts] = useState<PostPagination>(postsPagination);

  const handlerGetMorePosts = async () => {
    await fetch(posts.next_page)
      .then(response => response.json())
      .then(data => {
        const newPosts = data.results?.map(p => ({
          uid: p.uid,
          first_publication_date: p.first_publication_date,
          data: {
            title: p.data.title,
            subtitle: p.data.subtitle,
            author: p.data.author,
          },
        }));

        const newPostPagination = {
          next_page: data.next_page,
          results: [...posts.results, ...(newPosts as Post[])],
        } as PostPagination;

        setPosts(newPostPagination);
      })
      .catch(() => {
        console.log('erro');
      });
  };

  return (
    <main className={commonStyles.container}>
      <div className={styles.posts}>
        {posts.results.map(post => (
          <Link href={`/post/${post.uid}`} key={post.uid}>
            <a>
              <strong>{post.data.title}</strong>
              <p>{post.data.subtitle}</p>
              <div className={styles.containerInfo}>
                <div>
                  <FiCalendar />
                  <span>
                    {format(
                      new Date(post.first_publication_date),
                      'dd MMM yyyy',
                      {
                        locale: ptBR,
                      }
                    )}
                  </span>
                </div>
                <div>
                  <FiUser />
                  <span>{post.data.author}</span>
                </div>
              </div>
            </a>
          </Link>
        ))}
        {posts.next_page && (
          <button onClick={handlerGetMorePosts} className={styles.nextPage}>
            Carregar mais posts
          </button>
        )}
      </div>
    </main>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: ['posts.title', 'posts.subtitle', 'posts.author'],
      pageSize: 1,
    }
  );

  const posts = postsResponse.results?.map(post => ({
    uid: post.uid,
    first_publication_date: post.first_publication_date,
    data: {
      title: post.data.title,
      subtitle: post.data.subtitle,
      author: post.data.author,
    },
  }));

  return {
    props: {
      postsPagination: {
        next_page: postsResponse.next_page,
        results: posts,
      },
    },
  };
};
