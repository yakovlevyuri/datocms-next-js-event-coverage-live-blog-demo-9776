import Head from "next/head";
import { request } from "../lib/datocms";
import { Image, useQuerySubscription } from "react-datocms";
import TimeAgo from "react-timeago";
import ReactMarkdown from "react-markdown";
import { TransitionGroup, CSSTransition } from "react-transition-group";

export async function getServerSideProps() {
  const graphqlRequest = {
    query: `
      query HomePage($limit: IntType) {
        posts: allPosts(first: $limit, orderBy:_firstPublishedAt_DESC) {
          id
          content
          _firstPublishedAt
          photos {
            responsiveImage(imgixParams: {auto: [format]}) {
              ...imageFields
            }
          }
          author {
            name
            avatar {
              responsiveImage(imgixParams: {auto: [format], w: 60}) {
                ...imageFields
              }
            }
          }
        }
      }

      fragment imageFields on ResponsiveImage {
        aspectRatio
        base64
        height
        sizes
        src
        srcSet
        width
        alt
        title
      }
    `,
    variables: { limit: 10 },
  };

  return {
    props: {
      subscription: {
        ...graphqlRequest,
        // @ts-ignore
        initialData: await request(graphqlRequest),
        token: process.env.NEXT_PUBLIC_DATOCMS_API_TOKEN,
      },
    },
  };
}

export default function Home({ subscription }: { subscription: any }) {
  const { data, error, status } = useQuerySubscription(subscription);

  return (
    <div className="px-10 py-12 text-gray-700 bg-gray-100 body-font">
      <Head>
        <title>Create Next App</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="max-w-screen-sm mx-auto text-center">
        <p className="text-base font-semibold leading-6 tracking-wide text-indigo-600 uppercase">
          Real-times Updates Demo
        </p>
        <h3 className="mt-2 text-3xl font-extrabold leading-8 tracking-tight text-gray-900 sm:text-5xl sm:leading-10">
          Event Coverage LiveBlog
        </h3>
        <p className="max-w-xl mt-4 text-xl leading-7 text-gray-500 lg:mx-auto">
          A simple Next.js + Typescript + Tailwind project to demonstrate
          real-time capabilities of DatoCMS
        </p>
      </div>

      <div className="max-w-screen-sm mx-auto mt-20 mb-12 text-center">
        {status === "connecting" ? (
          <div>Connecting to DatoCMS...</div>
        ) : status === "connected" ? (
          <div className="flex flex-col items-center justify-center md:flex-row">
            <span className="relative flex w-3 h-3 mb-3 md:mb-0 md:mr-2">
              <span className="absolute inline-flex w-full h-full bg-pink-400 rounded-full opacity-75 animate-ping"></span>
              <span className="relative inline-flex w-3 h-3 bg-pink-500 rounded-full"></span>
            </span>
            <span>Connected to DatoCMS, receiving live updates!</span>
          </div>
        ) : (
          <div>Connection closed</div>
        )}
      </div>

      {error && (
        <div className="max-w-screen-sm mx-auto my-12">
          <h1 className="mb-3 text-lg font-bold text-gray-900 title-font">
            Error: {error.code}
          </h1>
          <div className="my-5">{error.message}</div>
          {error.response && (
            <pre className="p-5 mt-5 font-mono bg-gray-100">
              {JSON.stringify(error.response, null, 2)}
            </pre>
          )}
        </div>
      )}

      <div className="max-w-screen-sm mx-auto my-12">
        {data && (
          <TransitionGroup>
            {data.posts.map((post: any) => (
              <CSSTransition
                key={post.id}
                classNames={{
                  enter: "post-enter",
                  enterActive: "post-enter-active",
                  exit: "post-exit",
                  exitActive: "post-exit-active",
                }}
                timeout={{ enter: 1200, exit: 1200 }}
              >
                <div>
                  <div className="overflow-hidden bg-white rounded-lg shadow-xl">
                    {post.photos.map((photo: any) => (
                      <Image
                        key={photo.responsiveImage.src}
                        className="w-full"
                        data={photo.responsiveImage}
                      />
                    ))}
                    {post.content && (
                      <div className="p-4 md:p-8 md:text-xl content">
                        <ReactMarkdown children={post.content} />
                      </div>
                    )}
                  </div>
                  <div className="grid items-center grid-cols-2 pb-12 mt-4 text-xs text-gray-500 md:text-sm md:px-8">
                    <div className="flex items-center">
                      <Image
                        className="w-6 h-6 mr-2 rounded-full shadow"
                        data={post.author.avatar.responsiveImage}
                      />
                      <div>{post.author.name}</div>
                    </div>
                    <div className="text-right">
                      <TimeAgo date={post._firstPublishedAt} />
                    </div>
                  </div>
                </div>
              </CSSTransition>
            ))}
          </TransitionGroup>
        )}
      </div>
    </div>
  );
}
