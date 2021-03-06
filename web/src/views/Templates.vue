<template>
  <v-container>
    <v-row justify="space-between" align="center">
      <v-col>
        <p class="text-h4 font-weight-bold">
          Templates
        </p>
        <p>Templates are code-free and user-friendly structures that parse reports the way you tell them.</p>
      </v-col>
    </v-row>
    <v-divider />
    <v-row>
      <v-col>
        <v-text-field
          id="search"
          v-model="searchTerm"
          prepend-inner-icon="search"
          label="Filter by template"
          solo
          dense
          clearable
        />
        <v-skeleton-loader
          :loading="loading"
          transition="slide-y-transition"
          type="table-tbody"
        >
          <v-card outlined>
            <v-data-table
              :headers="headers"
              :items="filtredItems"
              :items-per-page="5"
              :search="searchTerm"
              item-key="_id"
            >
              <template v-slot:item.displayName="{ item }">
                <span
                  class="d-inline-block text-truncate"
                  style="max-width: 130px;"
                >
                  {{ item.displayName }}
                </span>
              </template>
              <template v-slot:item.createdAt="{ item }">
                <span class="text-none mr-5">{{ formatDate(item.createdAt) }}</span>
              </template>
              <template v-slot:item.updatedAt="{ item }">
                <span class="text-none mr-5">{{ formatDate(item.updatedAt) }}</span>
              </template>
              <template v-slot:item.actions="{ item }">
                <v-menu
                  bottom
                  right
                  transition="slide-x-transition"
                >
                  <template v-slot:activator="{ on, attrs }">
                    <v-btn
                      v-permission="['owner']"
                      icon
                      v-bind="attrs"
                      v-on="on"
                    >
                      <v-icon>mdi-dots-vertical</v-icon>
                    </v-btn>
                  </template>
                  <v-list>
                    <v-list-item @click.stop="openEditor(item)">
                      <v-list-item-title>Edit Template</v-list-item-title>
                    </v-list-item>
                    <v-divider />
                    <v-list-item @click.stop="openConfirmationDialog(item)">
                      <strong class="red--text text--lighten-1">Delete Template</strong>
                    </v-list-item>
                  </v-list>
                </v-menu>
              </template>
            </v-data-table>
          </v-card>
        </v-skeleton-loader>
      </v-col>
    </v-row>
    <v-dialog
      v-model="editorDialog"
      fullscreen
      hide-overlay
      transition="dialog-bottom-transition"
    >
      <v-card>
        <v-toolbar
          color="primary"
          dark
          dense
        >
          <v-btn
            icon
            dark
            @click.stop="closeEditor"
          >
            <v-icon>close</v-icon>
          </v-btn>
          <v-toolbar-title class="title">
            <b>Template Editor</b>
          </v-toolbar-title>
          <v-spacer />
          <v-toolbar-items>
            <v-btn text @click.stop="saveChanges()">
              save
              <v-icon right>
                save
              </v-icon>
            </v-btn>
          </v-toolbar-items>
        </v-toolbar>
        <editor
          ref="TemplateEditor"
          v-model="editedTemplate"
          mode="application/json"
        />
      </v-card>
    </v-dialog>
    <confirm-dialog
      v-model="confirmDialog"
      title="Delete this template?"
      message="Template will be deattached from reports and issues. You will need to apply a new template. Are you sure you want to continue?"
      @handle-click="deleteTemplate()"
    />
  </v-container>
</template>
<script lang="ts">
/* eslint-disable @typescript-eslint/no-use-before-define */
import {
  defineComponent,
  ref,
  computed,
  onMounted,
  ComputedRef,
  Ref,
} from '@vue/composition-api';
import {
  TEMPLATES_FETCH,
  TEMPLATES_EDIT,
  TEMPLATES_DELETE,
  SHOW_SUCCESS_MSG,
} from '@/store/actions';
import { toLower } from 'lodash';
import { formatDate } from '@/utils/helpers';
import Editor from '@/components/Editor.vue';
import ConfirmDialog from '@/components/dialogs/ConfirmDialog.vue';
import store from '@/store';
import { Template, TemplateWithStats } from '@/store/types';

export default defineComponent({
  name: 'Templates',

  components: {
    Editor,
    ConfirmDialog,
  },

  setup() {
    const searchTerm = ref('');
    const loading = ref(false);
    const headers = ref([
      {
        text: 'Name',
        width: '20%',
        align: 'center',
        value: 'displayName',
      },
      {
        text: 'Issues',
        width: '15%',
        align: 'center',
        value: 'numIssues',
      },
      {
        text: 'Reports',
        width: '15%',
        align: 'center',
        value: 'numReports',
      },
      {
        text: 'Created',
        width: '15%',
        align: 'center',
        value: 'createdAt',
        sortable: false,
      },
      {
        text: 'Updated',
        width: '15%',
        align: 'center',
        value: 'updatedAt',
        sortable: false,
      },
      {
        text: 'Actions',
        width: '25%',
        align: 'center',
        value: 'actions',
        sortable: false,
      },
    ]);

    const templates: ComputedRef<TemplateWithStats[]> = computed(
      () => store.state.templates.items
    );

    const filtredItems = computed(() =>
      templates.value.filter((item) =>
        toLower(item.displayName).includes(toLower(searchTerm.value))
      )
    );

    onMounted(async () => {
      await store
        .dispatch(TEMPLATES_FETCH, true)
        .then(() => {
          loading.value = false;
        })
        .catch(() => {});
    });

    const {
      editorDialog,
      editedTemplate,
      saveChanges,
      openEditor,
      closeEditor,
    } = useEditTemplate();

    const {
      confirmDialog,
      templateToDelete,
      openConfirmationDialog,
      deleteTemplate,
    } = useDeleteTemplate();

    return {
      editorDialog,
      loading,
      filtredItems,
      headers,
      searchTerm,
      editedTemplate,
      saveChanges,
      openEditor,
      closeEditor,
      confirmDialog,
      templateToDelete,
      openConfirmationDialog,
      deleteTemplate,
      formatDate,
    };
  },
});

function useEditTemplate() {
  const editorDialog = ref(false);
  const editedTemplate = ref('');
  const templateToEdit: Ref<Template> | Ref<{}> = ref({});

  function saveChanges() {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const {
      updatedAt,
      numReports,
      numIssues,
      createdAt,
      _id,
      __v,
      ...fields
    } = JSON.parse(editedTemplate.value);

    store
      .dispatch(TEMPLATES_EDIT, {
        name: (templateToEdit.value as Template).name,
        change: fields,
      })
      .then(async () => {
        editorDialog.value = false;
        await store.dispatch(SHOW_SUCCESS_MSG, 'The template has been updated');
      });
  }

  function openEditor(item: TemplateWithStats) {
    editorDialog.value = true;
    templateToEdit.value = item;
    editedTemplate.value = JSON.stringify(item, null, 2);
  }

  function closeEditor() {
    editorDialog.value = false;
  }

  return {
    editorDialog,
    editedTemplate,
    saveChanges,
    openEditor,
    closeEditor,
  };
}

function useDeleteTemplate() {
  const confirmDialog = ref(false);
  const templateToDelete: Ref<Template> | Ref<{}> = ref({});

  function openConfirmationDialog(item: TemplateWithStats) {
    confirmDialog.value = true;
    templateToDelete.value = item;
  }

  function deleteTemplate() {
    store
      .dispatch(TEMPLATES_DELETE, (templateToDelete.value as Template).name)
      .then(async () => {
        confirmDialog.value = false;
        templateToDelete.value = {};

        await store.dispatch(SHOW_SUCCESS_MSG, 'The template has been deleted');
      });
  }

  return {
    confirmDialog,
    templateToDelete,
    openConfirmationDialog,
    deleteTemplate,
  };
}
</script>