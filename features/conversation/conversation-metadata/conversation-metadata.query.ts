import type { IXmtpConversationId, IXmtpInboxId } from "@features/xmtp/xmtp.types"
import { queryOptions } from "@tanstack/react-query"
import { getConversationMetadata } from "@/features/conversation/conversation-metadata/conversation-metadata.api"
import { isTmpConversation } from "@/features/conversation/utils/tmp-conversation"
import { getReactQueryKey } from "@/utils/react-query/react-query.utils"
import { TimeUtils } from "@/utils/time.utils"
import { reactQueryClient } from "../../../utils/react-query/react-query.client"

export type IConversationMetadataQueryData = Awaited<ReturnType<typeof getConversationMetadata>>

type IArgs = {
  xmtpConversationId: IXmtpConversationId
  clientInboxId: IXmtpInboxId
}

function getConversationMetadataQueryFn({ xmtpConversationId, clientInboxId }: IArgs) {
  return getConversationMetadata({ xmtpConversationId, clientInboxId })
}

export function getConversationMetadataQueryOptions({
  xmtpConversationId,
  clientInboxId,
  caller,
}: IArgs & { caller?: string }) {
  const enabled = !!xmtpConversationId && !isTmpConversation(xmtpConversationId)
  return queryOptions({
    queryKey: getReactQueryKey({
      baseStr: "conversation-metadata",
      xmtpConversationId,
      clientInboxId,
    }),
    meta: {
      caller,
    },
    queryFn: () => getConversationMetadataQueryFn({ xmtpConversationId, clientInboxId }),
    enabled,
    gcTime: TimeUtils.days(30).toMilliseconds(), // Because the current user is the only one that can make changes to their conversation metadata
    staleTime: Infinity, // Because the current user is the only one that can make changes to their conversation metadata
  })
}

export function prefetchConversationMetadataQuery(args: IArgs & { caller: string }) {
  const { xmtpConversationId, clientInboxId, caller } = args
  return reactQueryClient.prefetchQuery(
    getConversationMetadataQueryOptions({ xmtpConversationId, clientInboxId, caller }),
  )
}

export const getConversationMetadataQueryData = (args: IArgs) => {
  const { xmtpConversationId, clientInboxId } = args
  return reactQueryClient.getQueryData(
    getConversationMetadataQueryOptions({ xmtpConversationId, clientInboxId }).queryKey,
  )
}

export function updateConversationMetadataQueryData(
  args: IArgs & { updateData: Partial<IConversationMetadataQueryData> },
) {
  const { updateData, xmtpConversationId, clientInboxId } = args
  reactQueryClient.setQueryData(
    getConversationMetadataQueryOptions({ xmtpConversationId, clientInboxId }).queryKey,
    (previousData) => ({
      xmtpConversationId: args.xmtpConversationId,
      deleted: false,
      pinned: false,
      unread: false,
      updatedAt: new Date().toISOString(),
      ...(previousData ?? {}),
      ...updateData,
    }),
  )
}

// TODO: Add back later when we're back at optimizing queries
// Was used to batch the requests so we can make 1 request to get all the conversation metadata
// const batchedGetConversationMetadata = create({
//   scheduler: windowScheduler(50),
//   resolver: (items, query) => {
//     const match = items.find(
//       (item) =>
//         conversationMetadataQueryKey(query.account, query.topic).join("-") ===
//         conversationMetadataQueryKey(item.account, item.topic).join("-")
//     );
//     if (!match) {
//       return null;
//     }

//     const { account, topic, ...backendProperties } = match;

//     // If we don't have any data for this conversation, we return null
//     if (Object.keys(backendProperties).length === 0) {
//       return null;
//     }

//     return match;
//   },
//   fetcher: async (args: IArgs[]) => {
//     const accountGroups = args.reduce((groups, arg) => {
//       groups[arg.account] = groups[arg.account] || [];
//       groups[arg.account].push(arg);
//       return groups;
//     }, {} as Record<string, IArgs[]>);

//     const results = await Promise.all(
//       Object.entries(accountGroups).map(async ([account, groupArgs]) => {
//         const conversationsData = await getConversationMetadatas({
//           account,
//           topics: groupArgs.map((arg) => arg.topic),
//         });

//         // Include topic in each item for resolver matching
//         return groupArgs.map((arg) => ({
//           ...conversationsData[arg.topic],
//           account,
//           topic: arg.topic,
//         }));
//       })
//     );

//     return results.flat();
//   },
// });
