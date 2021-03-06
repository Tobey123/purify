import { Module, VuexModule, Mutation, Action } from 'vuex-module-decorators';
import { User, ChangePasswordDto, UserSelfChange } from '../types';
import { SET_USERS } from '../mutations';
import {
  FETCH_USERS,
  CREATE_USER,
  DELETE_USER,
  CHANGE_PASSWORD,
  EDIT_USER,
  RESET_USER_PASSWORD,
  SELF_CHANGE,
} from '../actions';
import {
  getUsers,
  createUser,
  deleteUser,
  editUser,
  changeWhoami,
  resetUserPassword,
  getAccessTokens,
} from '@/api/users.service';
import { changePassword } from '@/api/auth.service';

@Module
export default class Users extends VuexModule {
  items: User[] = [];

  @Mutation
  [SET_USERS](users: User[]) {
    this.items = users;
  }

  @Action
  async [FETCH_USERS]() {
    const { data } = await getUsers();
    this.context.commit(SET_USERS, data);
  }

  @Action
  async [CREATE_USER](payload: any) {
    const { data } = await createUser(payload);
    await this.context.dispatch(FETCH_USERS);
    return data.link;
  }

  @Action
  async [RESET_USER_PASSWORD](userId: string) {
    const { data } = await resetUserPassword(userId);
    return data.link;
  }

  @Action
  async [EDIT_USER](payload: any) {
    const { userId, ...fields } = payload;
    const { data } = await editUser(userId, fields);
    await this.context.dispatch(FETCH_USERS);
  }

  @Action
  async [DELETE_USER](userId: string) {
    const { data } = await deleteUser(userId);
    await this.context.dispatch(FETCH_USERS);
    return data;
  }

  @Action
  async [CHANGE_PASSWORD](payload: ChangePasswordDto) {
    const { data } = await changePassword(payload);
    return data;
  }
}
