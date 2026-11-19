import { chain, path } from "funcfunc/lens";

export const INITIAL_MESSAGE_LIST = {
  messageList: {
    contents: {},
    ids: []
  },
}

export const messageListLens = path(["messageList"]);
export const contentsLens = path(["contents"]);
export const idsLens = path(["ids"]);

export const messageListContentsLens = chain([messageListLens, contentsLens]);
export const messageListIdsLens = chain([messageListLens, idsLens]);
