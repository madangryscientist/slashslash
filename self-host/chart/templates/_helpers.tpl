{{/* The release name is every object's name, so the claim is data-<release>-0. */}}
{{- define "slashslash.fullname" -}}
{{- .Release.Name | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "slashslash.selectorLabels" -}}
app.kubernetes.io/name: slashslash
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end -}}

{{- define "slashslash.labels" -}}
{{ include "slashslash.selectorLabels" . }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
helm.sh/chart: {{ printf "%s-%s" .Chart.Name .Chart.Version }}
{{- end -}}

{{- define "slashslash.secretName" -}}
{{- .Values.existingSecret | default (include "slashslash.fullname" .) -}}
{{- end -}}
