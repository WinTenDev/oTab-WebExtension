import Vue from 'vue';
import Vuex from 'vuex';
import modules from './modules';

Vue.use(Vuex);
const Store = new Vuex.Store({
  strict: false,
  modules,
  state: {
    isLoaded: false,
    firstChange: true,
    subItems: ['collections', 'notes', 'tasks'],
    activeMenu: '0',
    boards: [],
    activeBoard: '',
    activeTag: 'all_tags#e4e4e4',
  },
  getters: {
    allData: state => {
      return {
        boards: state.boards,
        notes: state.notes.items,
        collections: state.collections.items,
        tasks: state.tasks.items,
      };
    },
    boardList: state => {
      return state.boards.map(({ title, id }) => ({ title, id }));
    },
    board: state => {
      return state.boards.find(board => board.id === state.activeBoard);
    },
  },
  mutations: {
    changeBoolean(state, { key, data }) {
      state[key] = data;
    },
    setAllData(state, data) {
      state.boards = data.oTabData.boards;
      state.subItems.forEach(item => (state[item].items = data.oTabData[item]));
    },
    triggerSave(state, key) {
      state[key].items = { ...state[key].items };
    },
    newTag(state, { tag, getters }) {
      getters.board.allTags.push(tag);
    },
    createBoard(state, { title, id }) {
      state.boards.push({
        title: title,
        id: id,
        allTags: [],
      });
    },
    delTag(state, { getters, index }) {
      getters.board.allTags.splice(index, 1);
    },
    activeBoard(state, id) {
      state.activeTag = 'all_tags#e4e4e4';
      state.activeBoard = state.collections.activeBoard = state.tasks.activeBoard = state.notes.activeBoard = id;
    },
    activeMenu(state, index) {
      state.activeMenu = index;
    },
    activeTag(state, tagId) {
      state.activeTag = tagId;
    },
    addBoardToSubItem(state, { key, boardId }) {
      let items = state[key].items;
      state[key].items = {
        ...items,
        [boardId]: [],
      };
    },
    delAllRelatedItem(state, { key, tagId }) {
      state[key].items[state.activeBoard].forEach(item => {
        let findTagIndex = item.tags.findIndex(tag => tag.id === tagId);
        if (findTagIndex !== -1) item.tags.splice(findTagIndex, 1);
      });
    },
    deleteBoard(state, boardIndex) {
      state.boards.splice(boardIndex, 1);
    },
    deleteBoardSubitem(state, boardId) {
      state.subItems.forEach(item => delete state[item].items[boardId]);
    },
  },
  actions: {
    async deleteBoard({ state, commit }, boardId) {
      let boardIndex = state.boards.findIndex(board => board.id === boardId);
      await commit('deleteBoard', boardIndex);
      boardId === state.activeBoard ? commit('activeBoard', state.boards[0].id) : null;
      await commit('deleteBoardSubitem', boardIndex);
    },
    createNewTag({ commit, getters }, tag) {
      return new Promise((resolve, reject) => {
        let tagId = tag.name + tag.color;
        let isTagExist = getters.board.allTags.findIndex(tag => tag.id === tagId);
        if (isTagExist !== -1) {
          reject('You already add ' + tag.name);
        } else {
          let compTag = { ...tag, id: tagId };
          commit('newTag', { tag: compTag, getters });
          resolve();
        }
      });
    },
    deleteTag({ state, commit, getters }, tagId) {
      state.activeTag === tagId ? commit('activeTag', 'all_tags#e4e4e4') : null;
      let index = getters.board.allTags.findIndex(tag => tag.id === tagId);
      commit('delTag', { getters, index });
      // Delete all related tag in subitem
      state.subItems.forEach(item => commit('delAllRelatedItem', { key: item, tagId }));
    },
    createNewBoard({ commit, state }, title) {
      return new Promise((resolve, reject) => {
        let boardId = title.toLowerCase().replace(/ /g, '_');
        let findBoard = state.boards.find(board => board.id === boardId);
        if (findBoard) {
          reject('You already add ' + title);
        } else {
          commit('createBoard', { title: title, id: boardId });
          state.subItems.forEach(item => commit('addBoardToSubItem', { key: item, boardId }));
          commit('activeBoard', boardId);
          resolve();
        }
      });
    },
    async setAllData({ state, commit, getters }, { data, isEmpty }) {
      if (!isEmpty) {
        await commit('setAllData', data);
        await commit('activeBoard', state.boards[0].id);
      }
      await commit('changeBoolean', { key: 'firstChange', data: false });
      await commit('changeBoolean', { key: 'isLoaded', data: true });
    },
  },
});

export default Store;