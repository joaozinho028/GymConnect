
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// POST /upload-arquivo
uploadArquivo = async (req, res) => {
		try {
			console.log('[UPLOAD] Body:', req.body);
			console.log('[UPLOAD] Files:', req.files);
			const file = req.files?.file || req.file;
			const { id_empresa, id_filial, id_aluno } = req.body;
			if (!file || !id_empresa || !id_filial || !id_aluno) {
				console.error('[UPLOAD] Dados ausentes:', { file, id_empresa, id_filial, id_aluno });
				return res.status(400).json({ error: 'Arquivo, id_empresa, id_filial e id_aluno são obrigatórios.' });
			}
			const ext = file.name.split('.').pop();
			const nomeArquivo = `${id_empresa}-${id_filial}-${id_aluno}-${file.name}`;
			console.log('[UPLOAD] Nome do arquivo para salvar:', nomeArquivo);
			const { data, error } = await supabase.storage
				.from('alunos-arquivos')
				.upload(nomeArquivo, file.data, {
					contentType: file.mimetype,
					upsert: true,
				});
			if (error) {
				console.error('[UPLOAD] Erro ao salvar no Supabase:', error);
				return res.status(500).json({ error: error.message });
			}
			const url = `${process.env.SUPABASE_URL}/storage/v1/object/public/alunos-arquivos/${nomeArquivo}`;
			console.log('[UPLOAD] Upload realizado com sucesso:', url);
			return res.json({ url });
		} catch (err) {
			console.error('[UPLOAD] Erro inesperado:', err);
			return res.status(500).json({ error: err.message });
		}
};

// GET /upload-arquivo/listar?id_empresa=...&id_filial=...&id_aluno=...
listarArquivosAluno = async (req, res) => {
		try {
			console.log('[LISTAR] Query:', req.query);
			const { id_empresa, id_filial, id_aluno } = req.query;
			if (!id_empresa || !id_filial || !id_aluno) {
				console.error('[LISTAR] Dados ausentes:', { id_empresa, id_filial, id_aluno });
				return res.status(400).json({ error: 'id_empresa, id_filial e id_aluno são obrigatórios.' });
			}
			const prefix = `${id_empresa}-${id_filial}-${id_aluno}-`;
			const { data, error } = await supabase.storage
				.from('alunos-arquivos')
				.list('', { search: prefix });
			if (error) {
				console.error('[LISTAR] Erro ao buscar arquivos:', error);
				return res.status(500).json({ error: error.message });
			}
			const arquivos = (data || []).map((file) => ({
				nome: file.name,
				url: `${process.env.SUPABASE_URL}/storage/v1/object/public/alunos-arquivos/${file.name}`,
				size: file.metadata?.size || null,
				type: file.metadata?.mimetype || null,
			}));
			console.log('[LISTAR] Arquivos encontrados:', arquivos);
			return res.json(arquivos);
		} catch (err) {
			console.error('[LISTAR] Erro inesperado:', err);
			return res.status(500).json({ error: err.message });
		}
};


// DELETE /upload-arquivo/excluir
excluirArquivo = async (req, res) => {
	try {
		const { nome } = req.body;
		if (!nome) {
			return res.status(400).json({ error: 'Nome do arquivo é obrigatório.' });
		}
		const { error } = await supabase.storage
			.from('alunos-arquivos')
			.remove([nome]);
		if (error) {
			console.error('[EXCLUIR] Erro ao excluir:', error);
			return res.status(500).json({ error: error.message });
		}
		console.log('[EXCLUIR] Arquivo excluído:', nome);
		return res.json({ success: true });
	} catch (err) {
		console.error('[EXCLUIR] Erro inesperado:', err);
		return res.status(500).json({ error: err.message });
	}
};


module.exports = {
  uploadArquivo,
  listarArquivosAluno,
  excluirArquivo,
};