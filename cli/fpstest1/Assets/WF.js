function OnRenderObject ()
{

    //	GL.PushMatrix();
	GL.Begin(GL.LINES);	

    //	GL.modelview = Matrix4x4.TRS(transform.position, transform.rotation, transform.lossyScale);

    var v1 = Vector3(0,0,0);
    var v2 = Vector3(10,10,0);
    var v3 = Vector3(0,10,0);

    GL.Vertex(v1);
    GL.Color(Color.white);
    GL.Vertex(v2);
    GL.Color(Color.white);

	GL.End();
    //	GL.PopMatrix();
}
